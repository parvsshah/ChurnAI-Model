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
            <svg className="h-9 w-9" viewBox="0 0 25.6 25.6" xmlns="http://www.w3.org/2000/svg">
                <g fill="none" stroke="#fff" strokeWidth=".681" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18.983 18.636c.163-1.357.114-.774.7-1.022 1.705-.72 3.3-1.413 2.724-2.676-.587-1.29-3.26.122-4.3.56 0 0 .166-.504.322-.907.252-.653.545-2.127-.837-1.638-.916.324-1.327 2.133-1.46 3.042-.088.6-.086.71-.086.71s-.37-1.224-.994-2.263c-1.53-2.55-3.725-4.328-6.08-4.96-3.2-.86-6.97.4-8.09 3.07-1.7 4.05 3.003 10.023 5.696 12.16 0 0-.247.58-.402 1.06-.24.74-.306 1.56.442 1.84.985.37 1.6-.34 2.01-1.01.34-.56.465-.97.465-.97s1.382.68 3.07.68c.612 0 1.1-.093 1.1-.093s-.178 1.395-.057 2.14c.157.97.485 1.37 1.272 1.595.804.23 1.564-.11 2.037-.756.41-.56.638-1.34.726-2.6.08-1.13.19-1.334.19-1.334" fill="#336791" />
                    <path d="M12.814 15.861c-.162-.03-.328-.003-.493.043-.238.066-.414.2-.486.3 0 0-.23.393.213.587.335.147.835.058 1.05-.2.128-.155.09-.357-.034-.504-.084-.1-.208-.217-.25-.226z" fill="#fff" stroke="none" />
                    <path d="M10.074 15.12c-.162-.03-.328-.003-.493.043-.238.066-.414.2-.486.3 0 0-.23.393.213.587.335.147.835.058 1.05-.2.128-.155.09-.357-.034-.504-.084-.1-.208-.217-.25-.226z" fill="#fff" stroke="none" />
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
                <circle cx="35" cy="35" r="14" fill="#F7931E" />
                <circle cx="65" cy="35" r="14" fill="#3499CD" />
                <circle cx="35" cy="65" r="14" fill="#3499CD" />
                <circle cx="65" cy="65" r="14" fill="#F7931E" />
                <circle cx="50" cy="50" r="8" fill="#fff" />
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
            <svg className="h-9 w-9" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="gemGrad" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#4285F4" />
                        <stop offset="40%" stopColor="#9B72CB" />
                        <stop offset="70%" stopColor="#D96570" />
                        <stop offset="100%" stopColor="#D96570" />
                    </linearGradient>
                </defs>
                <path d="M14 28C14 21.756 9.072 16.572 2.828 16.044 1.904 15.96 1.12 15.876 0 15.708v-3.416c1.12-.168 1.904-.252 2.828-.336C9.072 11.428 14 6.244 14 0c0 6.244 4.928 11.428 11.172 11.956.924.084 1.708.168 2.828.336v3.416c-1.12.168-1.904.252-2.828.336C18.928 16.572 14 21.756 14 28z" fill="url(#gemGrad)" />
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
