/** El destello de cuatro puntas que separa y marca las cosas en Moderna. */
export function Estrella({ className = '' }: { className?: string }) {
    return (
        <svg aria-hidden viewBox="0 0 24 24" className={className}>
            <path
                fill="currentColor"
                d="M12 0c.9 6.4 4.6 10.6 12 12-7.4 1.4-11.1 5.6-12 12-.9-6.4-4.6-10.6-12-12C7.4 10.6 11.1 6.4 12 0Z"
            />
        </svg>
    )
}
