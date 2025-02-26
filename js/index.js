document.addEventListener('DOMContentLoaded', function () {
    document.querySelector('a[href="#flem"]').addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector('#flem').scrollIntoView({ behavior: 'smooth' });
    });

    document.querySelector('form').addEventListener('submit', function (e) {
        e.preventDefault();
        document.getElementById('thankYouModal').style.display = 'block';
        e.target.reset(); // Clear form entries
    });

    document.querySelector('.close').addEventListener('click', function () {
        document.getElementById('thankYouModal').style.display = 'none';
    });

    window.addEventListener('click', function (event) {
        if (event.target == document.getElementById('thankYouModal')) {
            document.getElementById('thankYouModal').style.display = 'none';
        }
    });
});