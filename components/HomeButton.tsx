import { JSX } from 'preact';
import { ButtonLink } from './Button.tsx';

export default function HomeButton(props: JSX.AnchorHTMLAttributes) {
    return (
        <ButtonLink href='/' variant='secondary' class={props.class ?? ''}>
            Go back home
        </ButtonLink>
    );
}
