import Button from "../button/Button";

export function Share({base}: {base: any}) {
    const lch = base.lch.string;
    
    function handleClick() {
        const url = window.location
        const newParams = new URLSearchParams([['color', lch]])
        const new_url = new URL(`${url.origin}${url.pathname}?${newParams.toString()}`);
        navigator.clipboard.writeText(new_url.toString())
    }

    return (<Button handler={handleClick} active={false}>
        Share
    </Button>)
}