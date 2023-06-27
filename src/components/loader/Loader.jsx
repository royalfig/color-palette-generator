import "./loader.css"
export default function Loader({children, loading}) {
    const className = loading ? "loader loading" : "loader";
    return (
        <div className={className}>
            {children}
        </div>
    );
}