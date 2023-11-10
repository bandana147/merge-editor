import { useState } from 'react';

import Add from '@spectrum-icons/workflow/Add';
import Remove from '@spectrum-icons/workflow/Remove';
import FitToScreen from '@spectrum-icons/workflow/Vignette';
import { ActionButton } from '@adobe/react-spectrum';

export default function ScreenSize({ theme }) {
    const [currentScale, setCurrentScale] = useState(1);

    function fitToScreen() {
        const newScale = 1;
        setCurrentScale(newScale);
        document.querySelector('#block').style.transform = `scale(${newScale})`;
    }

    function scaleDown() {
        const newScale = currentScale - 0.1;
        setCurrentScale(newScale);
        document.querySelector('#block').style.transform = `scale(${newScale})`;
        // document.querySelector('#block').style.top = `${newScale *  -450}px`;
    }

    function scaleUp() {
        const newScale = currentScale + 0.1;
        setCurrentScale(newScale);
        document.querySelector('#block').style.transform = `scale(${newScale})`;
    }

    return (
        <div className={`${theme} screen-tools`}>
            <ActionButton onClick={scaleDown}><Remove /></ActionButton>
            <ActionButton onClick={scaleUp}><Add /></ActionButton>
            <ActionButton onClick={fitToScreen}><FitToScreen /></ActionButton>
        </div>
    )
}