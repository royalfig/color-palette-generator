import "./input-group.css"

export function InputGroup({children}: {children: React.ReactNode}) {
    return (
        <div className="input-group">
            {children}
        </div>
    )
}