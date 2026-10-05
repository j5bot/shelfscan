/** Today as YYYY-MM-DD in local time. */
export const todayString = () => {
    const todayDate = new Date();
    return `${
        todayDate.getFullYear()
    }-${
        String(todayDate.getMonth() + 1).padStart(2, '0')
    }-${
        String(todayDate.getDate()).padStart(2, '0')
    }`;
};
