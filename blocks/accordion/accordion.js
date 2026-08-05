
export default function decorate(block) {
  const accordion = document.createElement('div');
  accordion.className = 'accordion';

  const rows = [...block.children];

  for (let index = 0; index < rows.length; index += 2) {
    const titleRow = rows[index];
    const contentRow = rows[index + 1];

    if (!titleRow) {
      break;
    }

    const itemTitle = document.createElement('div');
    itemTitle.className = 'item-title';
    itemTitle.setAttribute('role', 'button');
    itemTitle.setAttribute('tabindex', '0');
    itemTitle.setAttribute('aria-expanded', 'false');

    while (titleRow.firstElementChild) {
      itemTitle.append(titleRow.firstElementChild);
    }

    const itemContent = document.createElement('div');
    itemContent.className = 'item-content';

    if (contentRow) {
      while (contentRow.firstElementChild) {
        itemContent.append(contentRow.firstElementChild);
      }
    }

    accordion.append(itemTitle, itemContent);
  }

  block.replaceChildren(accordion);

  accordion.querySelectorAll('.item-title').forEach((title) => {
    const toggleSection = () => {
      const isOpen = title.classList.toggle('open');
      const content = title.nextElementSibling;

      title.setAttribute('aria-expanded', String(isOpen));

      if (content) {
        content.hidden = !isOpen;
      }
    };

    title.addEventListener('click', toggleSection);
    title.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        toggleSection();
      }
    });
  });
}