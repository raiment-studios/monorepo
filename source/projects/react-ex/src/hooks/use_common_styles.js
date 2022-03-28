import { createUseStyles } from 'react-jss';
import { useGoogleFont } from './use_google_font';

const styles = {
    body: {
        fontFamily: "'Quicksand', sans-serif",
    },

    '.sans': {
        fontFamily: "'Quicksand', sans-serif",
    },
    '.serif': {
        fontFamily: "'EB Garamond', serif",
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

const useCommonStyles2 = createUseStyles({
    '@global': styles,
});

export function useCommonStyles() {
    useCommonStyles2();
    useGoogleFont(
        'https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;500;600;700&display=swap'
    );
    useGoogleFont(
        'https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,500;1,600;1,700;1,800&display=swap'
    );
}
