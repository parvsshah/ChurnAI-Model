"""
LLM Integration Module with Task-Based API Key Assignment

Instead of rotating keys, each task type gets a dedicated API key.
This prevents one task from exhausting all keys.

Task Assignments:
- Key 1: Column Mapping
- Key 2: Domain Detection  
- Key 3: Personalized Recommendations
- OpenAI: Executive Summary Reports
"""

import os
import json
import re
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from enum import Enum

# Try to import LLM libraries
try:
    from google import genai
    HAS_GEMINI = True
except ImportError:
    HAS_GEMINI = False

try:
    from openai import OpenAI
    HAS_OPENAI = True
except ImportError:
    HAS_OPENAI = False

import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import settings
try:
    from config.settings import GEMINI_API_KEYS, OPENAI_API_KEYS
except ImportError:
    GEMINI_API_KEYS = [os.getenv("GEMINI_API_KEY", "")]
    OPENAI_API_KEYS = [os.getenv("OPENAI_API_KEY", "")]


class TaskType(Enum):
    """Types of LLM tasks"""
    COLUMN_MAPPING = "column_mapping"
    DOMAIN_DETECTION = "domain_detection"
    RECOMMENDATIONS = "recommendations"
    SUMMARY_REPORT = "summary_report"
    CUSTOMER_NARRATIVE = "customer_narrative"


# Task to API Key mapping
# Each task gets a dedicated key to prevent quota exhaustion
TASK_KEY_MAPPING = {
    TaskType.COLUMN_MAPPING: ("gemini", 0),      # Gemini Key 1
    TaskType.DOMAIN_DETECTION: ("gemini", 1),    # Gemini Key 2
    TaskType.RECOMMENDATIONS: ("gemini", 2),     # Gemini Key 3
    TaskType.SUMMARY_REPORT: ("openai", 0),      # OpenAI Key 1
    TaskType.CUSTOMER_NARRATIVE: ("gemini", 3),  # Gemini Key 4 (backup)
}


@dataclass
class LLMRecommendation:
    """AI-generated personalized recommendation"""
    customer_id: str
    risk_assessment: str
    personalized_actions: List[str]
    key_insights: str
    priority: str


class LLMEngine:
    """
    LLM engine with task-based API key assignment.
    
    Each task type uses a dedicated API key:
    - Column Mapping → Gemini Key 1
    - Domain Detection → Gemini Key 2
    - Recommendations → Gemini Key 3
    - Summary Reports → OpenAI Key
    
    This prevents one heavy task from exhausting all keys.
    """
    
    def __init__(self):
        self.gemini_keys = [k for k in GEMINI_API_KEYS if k]
        self.openai_keys = [k for k in OPENAI_API_KEYS if k]
        self.openai_clients = {}
        self.available = False
        
        self._setup()
    
    def _setup(self):
        """Initialize connections"""
        # Setup OpenAI clients
        if HAS_OPENAI:
            for i, key in enumerate(self.openai_keys):
                try:
                    self.openai_clients[i] = OpenAI(api_key=key)
                    self.available = True
                except Exception as e:
                    print(f"Warning: OpenAI key {i+1} setup failed: {e}")
        
        # Gemini doesn't need pre-initialization, just verify keys exist
        if HAS_GEMINI and self.gemini_keys:
            self.available = True
        
        if self.available:
            total_keys = len(self.gemini_keys) + len(self.openai_keys)
            print(f"🔑 LLM Engine: {len(self.gemini_keys)} Gemini + {len(self.openai_keys)} OpenAI keys configured")
            print(f"   Task assignments: Column→G1, Domain→G2, Recs→G3, Reports→OpenAI")
    
    def _get_key_for_task(self, task: TaskType) -> tuple:
        """Get the dedicated API key for a task"""
        provider, index = TASK_KEY_MAPPING.get(task, ("gemini", 0))
        
        if provider == "gemini":
            if index < len(self.gemini_keys):
                return ("gemini", self.gemini_keys[index], index)
            elif self.gemini_keys:
                return ("gemini", self.gemini_keys[0], 0)
        else:  # openai
            if index < len(self.openai_keys):
                return ("openai", self.openai_keys[index], index)
            elif self.openai_keys:
                return ("openai", self.openai_keys[0], 0)
        
        return (None, None, None)
    
    def _generate(self, prompt: str, task: TaskType) -> Optional[str]:
        """Generate response using the dedicated key for this task"""
        provider, api_key, key_index = self._get_key_for_task(task)
        
        if not api_key:
            return None
        
        try:
            if provider == "openai" and HAS_OPENAI:
                client = self.openai_clients.get(key_index)
                if not client:
                    client = OpenAI(api_key=api_key)
                
                response = client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": "You are a customer retention expert. Be concise."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.7,
                    max_tokens=800
                )
                return response.choices[0].message.content
                
            elif provider == "gemini" and HAS_GEMINI:
                client = genai.Client(api_key=api_key)
                response = client.models.generate_content(
                    model='gemini-2.0-flash', contents=prompt
                )
                return response.text
                
        except Exception as e:
            error_str = str(e).lower()
            if "429" in str(e) or "quota" in error_str:
                print(f"⚠️ {task.value} API key ({provider} #{key_index+1}) quota exceeded")
            else:
                print(f"LLM error for {task.value}: {e}")
            return None
        
        return None
    
    def generate_personalized_recommendation(
        self,
        customer_data: Dict[str, Any],
        signals: List[str],
        churn_probability: float,
        domain_context: Optional[str] = None
    ) -> Optional[LLMRecommendation]:
        """Generate recommendation using RECOMMENDATIONS key (Gemini Key 3)"""
        limited_data = {k: v for k, v in list(customer_data.items())[:10]}
        
        prompt = f"""Analyze customer and provide retention recommendations.
Customer: {json.dumps(limited_data, default=str)}
Churn Risk: {churn_probability:.1%}
Signals: {', '.join(signals[:5]) if signals else 'None'}
{f'Domain: {domain_context}' if domain_context else ''}

Return JSON only:
{{"risk_assessment": "1-2 sentences", "personalized_actions": ["action1", "action2", "action3"], "key_insights": "insight", "priority": "critical|high|medium|low"}}
"""
        
        text = self._generate(prompt, TaskType.RECOMMENDATIONS)
        if not text:
            return None
        
        try:
            json_match = re.search(r'\{[\s\S]*\}', text)
            if json_match:
                result = json.loads(json_match.group())
                return LLMRecommendation(
                    customer_id=str(customer_data.get('id', customer_data.get('customerID', 'unknown'))),
                    risk_assessment=result.get('risk_assessment', ''),
                    personalized_actions=result.get('personalized_actions', []),
                    key_insights=result.get('key_insights', ''),
                    priority=result.get('priority', 'medium')
                )
        except Exception:
            pass
        
        return None
    
    def generate_summary_report(
        self,
        total_customers: int,
        high_risk_count: int,
        avg_churn_probability: float,
        risk_distribution: Dict[str, int],
        top_signals: List[str],
        domain_context: Optional[str] = None
    ) -> Optional[str]:
        """Generate summary using SUMMARY_REPORT key (OpenAI)"""
        prompt = f"""Write 2-paragraph executive summary:
- Total: {total_customers}, High Risk: {high_risk_count} ({high_risk_count/max(total_customers,1)*100:.1f}%)
- Avg Churn: {avg_churn_probability:.1%}
- Distribution: {json.dumps(risk_distribution)}
- Top Signals: {', '.join(top_signals[:3]) if top_signals else 'None'}
{f'- Domain: {domain_context}' if domain_context else ''}

Include key findings and 2-3 recommendations. Use markdown.
"""
        return self._generate(prompt, TaskType.SUMMARY_REPORT)
    
    def detect_domain(self, column_names: List[str], sample_values: Dict[str, List]) -> Optional[str]:
        """Detect domain using DOMAIN_DETECTION key (Gemini Key 2)"""
        prompt = f"""Dataset domain? Columns: {', '.join(column_names[:10])}
Sample: {json.dumps({k: v[:2] for k, v in list(sample_values.items())[:3]}, default=str)}
Reply with domain name only (e.g., "Telecom churn", "Banking", "HR attrition"). Max 4 words.
"""
        result = self._generate(prompt, TaskType.DOMAIN_DETECTION)
        return result.strip()[:50] if result else None
    
    def generate_customer_narrative(
        self,
        customer_data: Dict[str, Any],
        prediction: str,
        probability: float,
        signals: List[str]
    ) -> Optional[str]:
        """Generate narrative using CUSTOMER_NARRATIVE key (Gemini Key 1)"""
        prompt = f"""2 sentences on customer's churn risk:
Data: {json.dumps({k: v for k, v in list(customer_data.items())[:8]}, default=str)}
Prediction: {prediction}, Probability: {probability:.1%}
Signals: {', '.join(signals[:3]) if signals else 'None'}
"""
        return self._generate(prompt, TaskType.CUSTOMER_NARRATIVE)
    
    def get_status(self) -> Dict[str, Any]:
        """Get status with task assignments"""
        return {
            "available": self.available,
            "gemini_keys": len(self.gemini_keys),
            "openai_keys": len(self.openai_keys),
            "task_assignments": {
                "column_mapping": f"Gemini #{TASK_KEY_MAPPING[TaskType.COLUMN_MAPPING][1]+1}",
                "domain_detection": f"Gemini #{TASK_KEY_MAPPING[TaskType.DOMAIN_DETECTION][1]+1}",
                "recommendations": f"Gemini #{TASK_KEY_MAPPING[TaskType.RECOMMENDATIONS][1]+1}",
                "summary_report": "OpenAI #1",
            }
        }


# Singleton
_llm_engine = None

def get_llm_engine() -> LLMEngine:
    """Get or create the LLM engine singleton"""
    global _llm_engine
    if _llm_engine is None:
        _llm_engine = LLMEngine()
    return _llm_engine
