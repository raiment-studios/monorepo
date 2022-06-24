import { createUseStyles } from 'react-jss';
import { useGoogleFont } from './use_google_font';

const styles = {
    body: {
        fontFamily: "'Quicksand', sans-serif",
    },
    '.mono': {
        fontFamily: 'monospace',
    },
    '.sans': {
        fontFamily: "'Quicksand', sans-serif",
    },
    '.serif': {
        fontFamily: "'EB Garamond', serif",
    },

    '.flex-col': {
        display: 'flex',
        flexDirection: 'column',
    },
    '.flex-row': {
        display: 'flex',
        flexDirection: 'row',
    },
    '.flex-row-center': {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
    },
    '.flex-center': {
        display: 'flex',
        flexDirection: 'column',
    },
};

Object.entries({
    '1px': '1px',
    '2px': '2px',
    '4px': '4px',
    '6px': '6px',
    '8px': '8px',
    '12px': '12px',
    '16px': '16px',
    '24px': '24px',
    '32px': '32px',
    '64px': '64px',
    '96px': '96px',
    '128px': '128px',
}).forEach(([key, value]) => {
    Object.entries({
        p: 'padding',
        m: 'margin',
    }).forEach(([short, full]) => {
        styles[`.${short}-${key}`] = { [`${full}`]: value };
        styles[`.${short}x-${key}`] = { [`${full}Left`]: value, [`${full}Right`]: value };
        styles[`.${short}y-${key}`] = { [`${full}Top`]: value, [`${full}Bottom`]: value };
        styles[`.${short}t-${key}`] = { [`${full}Top`]: value };
        styles[`.${short}b-${key}`] = { [`${full}Bottom`]: value };
        styles[`.${short}l-${key}`] = { [`${full}Left`]: value };
        styles[`.${short}r-${key}`] = { [`${full}Right`]: value };
    });
});

const useCommonStyles2 = createUseStyles({
    '@global': styles,
});

export function useCommonStyles() {
    useCommonStyles2();
    // See https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/font-display
    useGoogleFont(
        'https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;500;600;700&display=block'
    );
    useGoogleFont(
        'https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,500;1,600;1,700;1,800&display=block'
    );
}
