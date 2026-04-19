import Button from "../button/Button";

export function UiMode() {

    function handler() {
        console.log('Ui Mode')
    }

    return (
        <Button handler={handler} active={false}>
            UI
        </Button>
    )
}