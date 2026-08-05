
export default function decorate(block) {
  const accordion = document.createElement('div');
  accordion.className = 'accordion';
  [...block.children].forEach((row) => {
    const section = document.createElement('div');
    section.className = 'accordion-section';
    const header = document.createElement('div');
    header.className = 'accordion-header';
    header.innerHTML = row.children[0].innerHTML;
    const content = document.createElement('div');
    content.className = 'accordion-content';
    while (row.children[1].firstElementChild) content.append(row.children[1].firstElementChild);
    section.append(header, content);
    accordion.append(section);
  });
  block.replaceChildren(accordion);

  // Add click event listener to toggle accordion sections
  const headers = accordion.querySelectorAll('.accordion-header');
  headers.forEach((header) => {
    header.addEventListener('click', () => {
      const section = header.parentElement;
      section.classList.toggle('active');
      const content = section.querySelector('.accordion-content');
      if (section.classList.contains('active')) {
        content.style.maxHeight = content.scrollHeight + 'px';
      } else {
        content.style.maxHeight = null;
      }
    });
  });
}