document.addEventListener('DOMContentLoaded', () => {
    const historyItems = document.querySelectorAll('.history-item');

    historyItems.forEach(item => {
        item.addEventListener('click', () => {
            const wrapper = item.closest('.history-item-wrapper');
            document.querySelectorAll('.history-item-wrapper.expanded').forEach(openWrapper => {
                if (openWrapper !== wrapper) {
                    openWrapper.classList.remove('expanded');
                }
            });
            if (wrapper) {
                wrapper.classList.toggle('expanded');
            }
        });
    });
});
