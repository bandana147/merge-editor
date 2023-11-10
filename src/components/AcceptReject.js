import { Tooltip, TooltipTrigger, ActionButton } from '@adobe/react-spectrum'
import Close from '@spectrum-icons/workflow/Close';
import Tick from '@spectrum-icons/workflow/Checkmark';

export default function AcceptReject({ onReject, onAccept, acceptLabel, rejectLabel, isHide }) {
    if (isHide) {
        return null;
    }
    return (
        <div>
            <TooltipTrigger delay={0}>
                <ActionButton onClick={onReject}><Close /></ActionButton>
                <Tooltip>{rejectLabel}</Tooltip>
            </TooltipTrigger>
            <TooltipTrigger>
                <ActionButton onClick={onAccept}><Tick /></ActionButton>
                <Tooltip>{acceptLabel}</Tooltip>
            </TooltipTrigger>
        </div>
    )
}