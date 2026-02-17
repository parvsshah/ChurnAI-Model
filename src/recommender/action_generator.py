"""
Action Generator for Recommendation Engine

Generates actionable recommendations based on detected signals.
Uses template system with dynamic variable substitution.
"""

import re
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config.schema_config import ACTION_TEMPLATES
from recommender.signal_detector import Signal, CustomerSignals


@dataclass
class Action:
    """Represents a recommended action"""
    action_type: str
    description: str
    priority: str  # "low", "medium", "high", "urgent"
    signal_type: str
    details: Optional[str] = None


@dataclass
class CustomerRecommendations:
    """All recommendations for a customer"""
    customer_id: Optional[str] = None
    actions: List[Action] = field(default_factory=list)
    summary: str = ""
    priority_level: str = "low"
    _seen_descriptions: set = field(default_factory=set)
    
    def add_action(self, action: Action):
        """Add action only if not already added (deduplicate by description)"""
        # Skip duplicate actions
        if action.description in self._seen_descriptions:
            return
        
        self._seen_descriptions.add(action.description)
        self.actions.append(action)
        self._update_priority()
    
    def _update_priority(self):
        """Update priority based on actions"""
        priority_levels = {"low": 1, "medium": 2, "high": 3, "urgent": 4}
        max_priority = max((priority_levels.get(a.priority, 1) for a in self.actions), default=1)
        reverse_map = {1: "low", 2: "medium", 3: "high", 4: "urgent"}
        self.priority_level = reverse_map[max_priority]


class ActionGenerator:
    """
    Generates recommendations from detected signals.
    
    Uses configurable templates with dynamic substitution.
    """
    
    # Risk level to action priority mapping
    RISK_TO_PRIORITY = {
        "low": "low",
        "medium": "medium",
        "high": "high",
        "critical": "urgent"
    }
    
    # Extended action templates (domain-agnostic)
    EXTENDED_TEMPLATES = {
        "high_churn_probability": [
            "Immediate attention required - high churn risk",
            "Schedule proactive customer outreach",
            "Review account for potential issues",
            "Consider personalized retention offer"
        ],
        "high_cost": [
            "Review pricing plan for optimization opportunities",
            "Consider loyalty discount: {discount_range}",
            "Propose value bundle with better price-to-value ratio",
            "Analyze usage patterns for cost reduction options"
        ],
        "low_tenure": [
            "Assign dedicated onboarding support",
            "Initiate welcome program touchpoints",
            "Schedule check-in call within 30 days",
            "Ensure smooth initial experience"
        ],
        "no_commitment": [
            "Present long-term commitment benefits",
            "Offer upgrade incentive: annual plan discount",
            "Highlight premium features available with commitment",
            "Share success stories from committed customers"
        ],
        "missing_features": [
            "Recommend additional services: {missing_services}",
            "Offer free trial of value-add features",
            "Educate on benefits of full product suite",
            "Consider feature bundle promotion"
        ],
        "low_engagement": [
            "Trigger re-engagement campaign",
            "Offer usage incentives",
            "Check for product satisfaction issues",
            "Provide usage tips and best practices"
        ]
    }
    
    def __init__(self, custom_templates: Optional[Dict[str, List[str]]] = None):
        """
        Initialize action generator.
        
        Args:
            custom_templates: Additional custom action templates
        """
        self.templates = {**ACTION_TEMPLATES, **self.EXTENDED_TEMPLATES}
        if custom_templates:
            self.templates.update(custom_templates)
    
    def generate_actions(self, customer_signals: CustomerSignals) -> CustomerRecommendations:
        """
        Generate recommendations for a customer based on detected signals.
        
        Args:
            customer_signals: Detected signals for the customer
            
        Returns:
            CustomerRecommendations with actionable items
        """
        recommendations = CustomerRecommendations(
            customer_id=customer_signals.customer_id
        )
        
        # Sort signals by risk level (highest first)
        sorted_signals = sorted(
            customer_signals.signals,
            key=lambda s: {"critical": 4, "high": 3, "medium": 2, "low": 1}.get(s.risk_level, 0),
            reverse=True
        )
        
        # Generate actions for each signal
        for signal in sorted_signals:
            actions = self._generate_signal_actions(signal)
            for action in actions:
                recommendations.add_action(action)
        
        # Generate summary
        recommendations.summary = self._generate_summary(customer_signals, recommendations)
        
        return recommendations
    
    def generate_actions_batch(
        self, 
        signals_list: List[CustomerSignals]
    ) -> List[CustomerRecommendations]:
        """
        Generate recommendations for multiple customers.
        
        Args:
            signals_list: List of CustomerSignals
            
        Returns:
            List of CustomerRecommendations
        """
        return [self.generate_actions(cs) for cs in signals_list]
    
    def _generate_signal_actions(self, signal: Signal) -> List[Action]:
        """Generate actions for a specific signal"""
        actions = []
        templates = self.templates.get(signal.signal_type, [])
        
        # Take top 2 most relevant templates
        for template in templates[:2]:
            description = self._substitute_variables(template, signal)
            actions.append(Action(
                action_type=signal.signal_type,
                description=description,
                priority=self.RISK_TO_PRIORITY.get(signal.risk_level, "medium"),
                signal_type=signal.signal_type,
                details=signal.evidence
            ))
        
        return actions
    
    def _substitute_variables(self, template: str, signal: Signal) -> str:
        """Substitute variables in template with actual values"""
        result = template
        
        # Replace common placeholders
        replacements = {
            "{discount_range}": "10-20%",
            "{discount_pct}": "15",
        }
        
        # Add signal-specific values
        if signal.column_involved:
            replacements["{column_name}"] = signal.column_involved
        
        if signal.value is not None:
            if isinstance(signal.value, list):
                replacements["{missing_services}"] = ", ".join(str(v) for v in signal.value[:3])
            else:
                replacements["{value}"] = str(signal.value)
        
        # Apply replacements
        for placeholder, value in replacements.items():
            result = result.replace(placeholder, value)
        
        # Remove any remaining unsubstituted placeholders
        result = re.sub(r'\{[^}]+\}', '', result)
        
        return result.strip()
    
    def _generate_summary(
        self, 
        signals: CustomerSignals, 
        recommendations: CustomerRecommendations
    ) -> str:
        """Generate a summary statement"""
        if not signals.signals:
            return "No immediate churn risk indicators detected."
        
        risk_descriptions = {
            "low": "minimal churn risk",
            "medium": "moderate churn risk requiring attention",
            "high": "elevated churn risk requiring prompt action",
            "critical": "critical churn risk requiring immediate intervention"
        }
        
        prob_str = ""
        if signals.churn_probability is not None:
            prob_str = f" (predicted probability: {signals.churn_probability:.1%})"
        
        signal_types = list(set(s.signal_type for s in signals.signals))
        signals_str = ", ".join(signal_types[:3])
        if len(signal_types) > 3:
            signals_str += f" (+{len(signal_types)-3} more)"
        
        return (
            f"Customer shows {risk_descriptions[signals.overall_risk]}{prob_str}. "
            f"Key factors: {signals_str}. "
            f"Recommended {len(recommendations.actions)} intervention actions."
        )
    
    def get_priority_actions(
        self, 
        recommendations_list: List[CustomerRecommendations],
        min_priority: str = "high"
    ) -> List[Dict[str, Any]]:
        """
        Get high-priority actions across all customers.
        
        Args:
            recommendations_list: List of recommendations
            min_priority: Minimum priority to include
            
        Returns:
            List of priority actions with customer info
        """
        priority_levels = {"low": 1, "medium": 2, "high": 3, "urgent": 4}
        min_level = priority_levels.get(min_priority, 3)
        
        priority_actions = []
        for rec in recommendations_list:
            for action in rec.actions:
                if priority_levels.get(action.priority, 0) >= min_level:
                    priority_actions.append({
                        "customer_id": rec.customer_id,
                        "action": action.description,
                        "priority": action.priority,
                        "signal": action.signal_type,
                        "details": action.details
                    })
        
        # Sort by priority
        priority_actions.sort(
            key=lambda x: priority_levels.get(x["priority"], 0),
            reverse=True
        )
        
        return priority_actions
