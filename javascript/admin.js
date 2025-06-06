document.addEventListener('DOMContentLoaded', function() {
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    const currentPath = window.location.pathname.split('/').pop();

    sidebarLinks.forEach(link => {
        const linkPath = link.getAttribute('href');
        const parentLi = link.parentElement;

        parentLi.classList.remove('active');

        if (linkPath === currentPath) {
            parentLi.classList.add('active');
        }
    });
});
