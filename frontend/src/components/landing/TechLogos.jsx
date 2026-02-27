/**
 * SVG tech logos for the marquee — cosmic-themed (white/violet fill).
 * Each exports a React component rendering an inline SVG.
 */

/* ── Python ── */
export function PythonLogo() {
    return (
        <div className="flex items-center gap-2.5">
            <svg className="h-9 w-9" viewBox="0 0 256 255" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="pyA" x1="12.96%" y1="12.07%" x2="79.64%" y2="78.57%">
                        <stop offset="0%" stopColor="#387EB8" />
                        <stop offset="100%" stopColor="#366994" />
                    </linearGradient>
                    <linearGradient id="pyB" x1="19.13%" y1="20.58%" x2="90.43%" y2="88.29%">
                        <stop offset="0%" stopColor="#FFE052" />
                        <stop offset="100%" stopColor="#FFC331" />
                    </linearGradient>
                </defs>
                <path d="M126.916.072c-64.832 0-60.784 28.115-60.784 28.115l.072 29.128h61.868v8.745H41.631S.145 61.355.145 126.77c0 65.417 36.21 63.097 36.21 63.097h21.61v-30.356s-1.165-36.21 35.632-36.21h61.362s34.475.557 34.475-33.319V33.97S194.67.072 126.916.072M92.802 19.66a11.12 11.12 0 0 1 11.13 11.13 11.12 11.12 0 0 1-11.13 11.13 11.12 11.12 0 0 1-11.13-11.13 11.12 11.12 0 0 1 11.13-11.13" fill="url(#pyA)" />
                <path d="M128.757 254.126c64.832 0 60.784-28.115 60.784-28.115l-.072-29.127H127.6v-8.745h86.441s41.486 4.705 41.486-60.712c0-65.416-36.21-63.096-36.21-63.096h-21.61v30.355s1.165 36.21-35.632 36.21h-61.362s-34.475-.557-34.475 33.32v56.013s-5.235 33.897 62.518 33.897m34.114-19.586a11.12 11.12 0 0 1-11.13-11.13 11.12 11.12 0 0 1 11.13-11.131 11.12 11.12 0 0 1 11.13 11.13 11.12 11.12 0 0 1-11.13 11.13" fill="url(#pyB)" />
            </svg>
            <span className="text-[#e8e5f0] text-base font-semibold tracking-wide">Python</span>
        </div>
    );
}

/* ── FastAPI ── */
export function FastAPILogo() {
    return (
        <div className="flex items-center gap-2.5">
            <svg className="h-9 w-9" viewBox="0 0 154 154" xmlns="http://www.w3.org/2000/svg">
                <circle cx="77" cy="77" r="77" fill="#009688" />
                <path d="M81.375 18.667l-38.75 70H77.5l-3.875 46.666 38.75-70H77.5z" fill="#fff" />
            </svg>
            <span className="text-[#e8e5f0] text-base font-semibold tracking-wide">FastAPI</span>
        </div>
    );
}

/* ── PostgreSQL ── */
export function PostgreSQLLogo() {
    return (
        <div className="flex items-center gap-2.5">
            <svg className="h-9 w-9" viewBox="0 0 432.071 445.383" xmlns="http://www.w3.org/2000/svg">
                <g>
                    <path d="M323.205 324.227c2.833-23.601 1.984-27.062 19.563-23.239l4.463.392c13.517.615 31.199-2.174 41.587-7 22.362-10.376 35.622-27.7 13.572-23.148-50.297 10.376-53.755-6.655-53.755-6.655 53.111-78.803 75.313-178.836 56.149-203.322C352.514-5.534 262.036 26.049 260.522 26.869l-.482.089c-9.938-2.062-21.06-3.294-33.554-3.496-22.761-.374-40.032 5.967-53.133 15.904 0 0-161.408-66.498-153.899 83.628 1.597 31.936 45.777 241.655 98.47 178.31 19.259-23.163 37.871-42.748 37.871-42.748 9.242 6.14 20.307 9.272 31.912 8.147l.897-.765c-.281 2.876-.157 5.689.359 9.019-13.572 15.167-9.584 17.83-36.723 23.416-27.457 5.659-11.326 15.734-.797 18.367 12.768 3.193 42.305 7.716 62.268-20.224l-.795 3.188c5.325 4.26 4.965 30.619 5.72 49.452.756 18.834 2.017 36.409 5.856 46.771 3.839 10.36 8.369 37.05 44.036 29.406 29.809-6.388 52.6-15.582 54.677-101.107" fill="#336791" />
                    <path d="M402.395 271.23c-50.302 10.376-53.76-6.655-53.76-6.655 53.111-78.808 75.313-178.843 56.153-203.326-52.27-66.785-142.752-35.2-144.262-34.38l-.486.087c-9.938-2.063-21.06-3.292-33.56-3.496-22.761-.373-40.026 5.967-53.127 15.902 0 0-161.411-66.495-153.904 83.63 1.597 31.938 45.776 241.657 98.471 178.312 19.26-23.163 37.869-42.748 37.869-42.748 9.243 6.14 20.308 9.272 31.908 8.147l.901-.765a38.897 38.897 0 0 0 .359 9.019c-13.572 15.167-9.584 17.83-36.723 23.416-27.459 5.659-11.328 15.734-.797 18.367 12.768 3.193 42.307 7.716 62.266-20.224l-.795 3.188c5.325 4.26 9.056 27.711 8.428 48.969-.628 21.259-1.081 35.811 3.333 47.159 4.414 11.348 8.614 37.557 44.788 29.456 30.257-6.781 46.086-24.413 48.219-53.765 1.52-20.905 4.98-17.829 5.209-36.508l2.762-8.754c3.187-26.556.306-35.15 18.864-31.167l4.469.392c13.517.615 31.208-2.174 41.591-7 22.358-10.376 35.618-27.7 13.573-23.148z" fill="#fff" />
                    <path d="M215.866 286.484c-1.385 49.516.348 99.377 5.193 111.495 4.848 12.118 15.223 35.688 50.22 28.39 29.22-6.088 40.287-18.21 43.867-43.079 2.495-17.319 7.906-58.465 8.604-65.33" fill="#336791" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
                </g>
            </svg>
            <span className="text-[#e8e5f0] text-base font-semibold tracking-wide">PostgreSQL</span>
        </div>
    );
}

/* ── scikit-learn ── */
export function ScikitLearnLogo() {
    return (
        <div className="flex items-center gap-2.5">
            <svg className="h-9 w-9" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                {/* Orange large circle */}
                <circle cx="58" cy="45" r="38" fill="#F7931E" />
                {/* Blue small circle */}
                <circle cx="28" cy="68" r="22" fill="#29ABE2" />
                {/* scikit text */}
                <text x="44" y="52" textAnchor="middle" fontFamily="Arial,sans-serif" fontSize="14" fontStyle="italic" fill="#fff" fontWeight="bold">scikit</text>
                {/* learn text */}
                <text x="58" y="72" textAnchor="middle" fontFamily="Georgia,serif" fontSize="22" fontStyle="italic" fill="#252525" fontWeight="bold">learn</text>
            </svg>
            <span className="text-[#e8e5f0] text-base font-semibold tracking-wide">scikit-learn</span>
        </div>
    );
}

/* ── React ── */
export function ReactLogo() {
    return (
        <div className="flex items-center gap-2.5">
            <svg className="h-9 w-9" viewBox="-11.5 -10.232 23 20.463" xmlns="http://www.w3.org/2000/svg">
                <circle r="2.05" fill="#61DAFB" />
                <g stroke="#61DAFB" fill="none" strokeWidth="1">
                    <ellipse rx="11" ry="4.2" />
                    <ellipse rx="11" ry="4.2" transform="rotate(60)" />
                    <ellipse rx="11" ry="4.2" transform="rotate(120)" />
                </g>
            </svg>
            <span className="text-[#e8e5f0] text-base font-semibold tracking-wide">React</span>
        </div>
    );
}

/* ── Vite ── */
export function ViteLogo() {
    return (
        <div className="flex items-center gap-2.5">
            <svg className="h-9 w-9" viewBox="0 0 410 404" xmlns="http://www.w3.org/2000/svg">
                <path d="M399.641 59.525l-183.998 329.02c-3.799 6.793-13.559 6.96-17.575.3L8.788 59.525c-4.367-7.25 2.238-15.755 10.353-13.789L202.39 87.816c1.382.336 2.825.332 4.205-.01l182.263-42.258c8.07-1.873 14.603 6.55 10.783 13.977z" fill="url(#viteA)" />
                <path d="M292.965 1.474l-130.46 23.636c-2.528.458-4.371 2.67-4.371 5.247l-8.472 186.755c-.134 2.954 2.693 5.186 5.545 4.38l29.563-8.354c3.244-.917 6.237 1.856 5.539 5.135l-12.348 57.97c-.762 3.574 2.726 6.46 5.998 4.963l20.858-9.548c3.283-1.503 6.775 1.41 5.99 4.995l-19.63 89.69c-1.113 5.085 5.593 7.675 8.363 3.233l1.85-2.97 102.14-199.065c1.603-3.127-1.024-6.705-4.439-6.043l-30.665 5.944c-3.375.654-6.095-2.795-4.714-5.976l24.236-55.796c1.37-3.155-1.274-6.56-4.606-5.934z" fill="url(#viteB)" />
                <defs>
                    <linearGradient id="viteA" x1="6.001" y1="32.54" x2="235" y2="344" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#41D1FF" />
                        <stop offset="1" stopColor="#BD34FE" />
                    </linearGradient>
                    <linearGradient id="viteB" x1="194.651" y1="8.818" x2="236.076" y2="292.989" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#FFBD4F" />
                        <stop offset="1" stopColor="#FF9640" />
                    </linearGradient>
                </defs>
            </svg>
            <span className="text-[#e8e5f0] text-base font-semibold tracking-wide">Vite</span>
        </div>
    );
}

/* ── Tailwind CSS ── */
export function TailwindLogo() {
    return (
        <div className="flex items-center gap-2.5">
            <svg className="h-8 w-auto" viewBox="0 0 54 33" xmlns="http://www.w3.org/2000/svg">
                <path
                    fillRule="evenodd" clipRule="evenodd"
                    d="M27 0C19.8 0 15.3 3.6 13.5 10.8c2.7-3.6 5.85-4.95 9.45-4.05 2.054.513 3.522 2.004 5.147 3.653C30.744 13.09 33.808 16.2 40.5 16.2c7.2 0 11.7-3.6 13.5-10.8-2.7 3.6-5.85 4.95-9.45 4.05-2.054-.513-3.522-2.004-5.147-3.653C36.756 3.11 33.692 0 27 0zM13.5 16.2C6.3 16.2 1.8 19.8 0 27c2.7-3.6 5.85-4.95 9.45-4.05 2.054.514 3.522 2.004 5.147 3.653C17.244 29.29 20.308 32.4 27 32.4c7.2 0 11.7-3.6 13.5-10.8-2.7 3.6-5.85 4.95-9.45 4.05-2.054-.514-3.522-2.004-5.147-3.653C23.256 19.31 20.192 16.2 13.5 16.2z"
                    fill="#38BDF8"
                />
            </svg>
            <span className="text-[#e8e5f0] text-base font-semibold tracking-wide">Tailwind</span>
        </div>
    );
}

/* ── Gemini (Google) ── */
export function GeminiLogo() {
    return (
        <div className="flex items-center gap-2.5">
            <svg className="h-9 w-9" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="gemGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#EA4335" />
                        <stop offset="25%" stopColor="#FBBC04" />
                        <stop offset="50%" stopColor="#34A853" />
                        <stop offset="75%" stopColor="#4285F4" />
                        <stop offset="100%" stopColor="#EA4335" />
                    </linearGradient>
                </defs>
                {/* Four-pointed star shape like the Gemini sparkle */}
                <path d="M50 0 C50 27.6 72.4 50 100 50 C72.4 50 50 72.4 50 100 C50 72.4 27.6 50 0 50 C27.6 50 50 27.6 50 0Z" fill="url(#gemGrad)" />
            </svg>
            <span className="text-[#e8e5f0] text-base font-semibold tracking-wide">Gemini</span>
        </div>
    );
}

/* ── OpenAI ── */
export function OpenAILogo() {
    return (
        <div className="flex items-center gap-2.5">
            <svg className="h-8 w-8" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.998 5.998 0 0 0-3.998 2.9 6.042 6.042 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071.005l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071-.006l4.83 2.788a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.658zM20.946 8.72l-.142-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.085a4.499 4.499 0 0 1 7.37-3.456l-.142.08L8.704 5.46a.795.795 0 0 0-.392.682zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z" fill="#fff" />
            </svg>
            <span className="text-[#e8e5f0] text-base font-semibold tracking-wide">OpenAI</span>
        </div>
    );
}
