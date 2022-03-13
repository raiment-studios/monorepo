import { createUseStyles } from 'react-jss';

const styles = {
    body: {
        fontFamily: "'Quicksand', sans-serif",
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

export const useCommonStyles = createUseStyles({
    '@global': styles,
});
