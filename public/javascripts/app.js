class ContactListModel {
  constructor() {
    this.contacts = null;
  }

  async fetchContacts() {
    let response = await fetch('/api/contacts');
    let contacts = await response.json();

    contacts.forEach(contact => {
      if (contact.tags) {
        contact.tags = contact.tags.split(',')
      }
    });

    return this.contacts = contacts;
  }

  async fetchContact(id) {
    let response = await fetch(`/api/contacts/${id}`);
    let contact = await response.json();
    return contact;
  }

  async updateContact(contactInfo) {
    let form = document.querySelector('#contact-form');

    if (form.dataset.method === 'put') {
      let contactId = form.action.split('/').slice(-1).pop();
      contactInfo.id = contactId;
    }

    let response = await fetch(form.action, {
      method: form.dataset.method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(contactInfo),
    });

    return response;
  }

  deleteContact(id) {
    fetch(`/api/contacts/${id}`, {
      method: 'delete'
    })
  }
}

class ContactListView {
  constructor() {
    this.templates = {};
    this.registerTemplates();
  }

  registerTemplates() {
    let templates = [].slice.call(document.querySelectorAll('[type="text/x-handlebars"'));
    templates.forEach(template => {
      this.templates[template.id] = Handlebars.compile(template.innerHTML)
    })

    let partials = [].slice.call(document.querySelectorAll('[data-type="partial"'));
    partials.forEach(partial => {
      Handlebars.registerPartial(partial.id, partial.innerHTML);
    })
  }

  displayNewContactForm() {
    let form = document.querySelector('#contact-form');

    form.querySelector('h2').textContent = 'Create Contact';
    form.querySelector('input[type="submit"').value = 'Save Contact';
    form.action = `/api/contacts`;
    form.setAttribute('data-method', 'post')
    
    form.classList.remove('hide');
    this.hideNavAndList();
    this.hideEmptyQueryMessage();
  }

  insertTagsToForm(tags) {
    let tagsArray = tags.split(',');
    let html = this.templates.tags({tags: tagsArray});
    let tagsList = document.querySelector('#tags-list');

    tagsList.innerHTML = html;
    tagsList.setAttribute('data-tags', tags);
  }

  displayEditContactForm(contact) {
    let form = document.querySelector('#contact-form');
    form.querySelector('h2').textContent = 'Edit Contact';
    form.querySelector('input[type="submit"').value = 'Save Changes';
    form.action = `/api/contacts/${contact.id}`;
    form.setAttribute('data-method', 'put')
    form['full_name'].value = contact['full_name'];
    form.email.value = contact.email;
    form['phone_number'].value = contact['phone_number'];

    form.classList.remove('hide');
    this.hideNavAndList()
    this.hideEmptyQueryMessage();

    if (contact.tags) {
      this.insertTagsToForm(contact.tags)
    };
  }

  hideAndResetContactForm() {
    let form = document.querySelector('#contact-form');
    let tagsList = document.querySelector('#tags-list');
    form.reset();
    form.classList.add('hide');
    tagsList.innerHTML = '';
    tagsList.setAttribute('data-tags', '');

    this.displayNavAndList();

    document.querySelector('#search-bar').value = '';

    this.clearFormErrors();    
  }

  clearFormErrors() {
    [...document.querySelectorAll('.error-msg')].forEach(div => {
      div.classList.add('hide');
    });

    [...document.querySelectorAll('.error')].forEach(input => {
      input.classList.remove('error');
    })
  }

  hideNavAndList() {
    let nav = document.querySelector('#nav');
    let list = document.querySelector('#list');
    nav.classList.add('hide');
    list.classList.add('hide');
  }

  displayNavAndList() {
    let nav = document.querySelector('#nav');
    let list = document.querySelector('#list');
    nav.classList.remove('hide');
    list.classList.remove('hide');
    this.showAllContacts();
  }

  removeTag(e) {
    let tagToDelete = e.target.previousElementSibling.textContent.trim();
    let tags = e.target.parentElement.dataset.tags.split(',');
    tags.splice(tags.indexOf(tagToDelete), 1);
    e.target.parentElement.setAttribute('data-tags', tags);

    let tagList = e.target.parentElement;
    tagList.removeChild(e.target.previousSibling);
    tagList.removeChild(e.target);
  }

  addTag(e) {
    let input = e.target.previousElementSibling;
    let tagsList = e.target.parentElement.firstElementChild;
    let tagToAdd = input.value.trim().toLowerCase();
    let tagsString = tagsList.dataset.tags;
    let tagsArray = tagsString.length ? tagsString.split(',') : [];
   
    if (tagToAdd.length && tagsArray.indexOf(tagToAdd) === -1) {
      tagsArray.push(tagToAdd);
      tagsList.setAttribute('data-tags', tagsArray.join(','));
      let html = this.templates['add_tag'](tagToAdd);
      tagsList.insertAdjacentHTML('beforeend', html);
    }

    input.value = '';
  }

  filterByTag(tag) {
    this.showAllContacts();

    let contacts = [...document.querySelectorAll('.contact')];
    contacts.forEach(contact => {
      let tags = [...contact.querySelectorAll('a.tag')]
        .map(({textContent}) => textContent);
      if (tags.indexOf(tag) === -1) {
        contact.classList.add('hide');
        this.displayShowAllBtn();
      }
    })
  }

  filterByName(query) {
    this.showAllContacts();

    let contacts = [...document.querySelectorAll('.contact')];
    let emptyQueryMsg = document.querySelector('#empty-query-msg');
    let displayed = contacts.length;
    emptyQueryMsg.classList.add('hide');
    
    contacts.forEach(contact => {
      let name = contact.firstElementChild.textContent.toLowerCase();

      if (!name.startsWith(query.toLowerCase())) {
        contact.classList.add('hide');
        this.displayShowAllBtn();
        displayed -= 1;
      }
    });

    if (!displayed) {
      emptyQueryMsg.classList.remove('hide');
      emptyQueryMsg.firstElementChild.textContent = query;
    } else {
      this.hideEmptyQueryMessage();
    }
  }

  hideEmptyQueryMessage() {
    let emptyQueryMsg = document.querySelector('#empty-query-msg');
    emptyQueryMsg.classList.add('hide');
  }

  displayShowAllBtn() {
    let button = document.querySelector('button.show-all');
    button.classList.remove('hide');
  }

  showAllContacts() {
    let button = document.querySelector('button.show-all');
    let contacts = [...document.querySelectorAll('.contact')];

    button.classList.add('hide');
    this.hideEmptyQueryMessage();
    contacts.forEach(contact => contact.classList.remove('hide'));
  }
}

class ContactListController {
  constructor(model, view) {
    this.model = model;
    this.view = view;
    this.VALID_REGEX = {
      'full_name': /[a-z]+ [a-z]+( [a-z]+)?/i,
      'email' : /\w+@\w+(\.\w+)+/i,
      'phone_number': /\d?-?\d{3}-?\d{3}-?\d{4}/
    };

    this.loadList();
    this.bindEvents();
  }

  formDataToJson(formData) {
    let json = {};
    for (let pair of formData) {
      json[pair[0]] = pair[1].trim();
    }
    return json;
  }

  async loadList() {
    let list = document.querySelector('#list');
    let contacts = await this.model.fetchContacts();

    let contactsTemplate = this.view.templates.contacts;
    list.innerHTML = contactsTemplate({ contacts });
  }

  async loadEditForm(contactId) {
    let contact = await this.model.fetchContact(contactId);
    this.view.displayEditContactForm(contact);
  }

  validateContactForm(contactInfo) {
    let valid = true;
    let fields = Object.keys(contactInfo);

    fields.forEach(field => {
      if (field === 'tags') { return; }

      let regex = this.VALID_REGEX[field];
      let div = document.querySelector(`label[for="${field}"]`).nextElementSibling;
      let input = document.querySelector(`#${field}`);

      if (!contactInfo[field].match(regex)) {  
        div.classList.remove('hide');
        input.classList.add('error');

        valid = false;
      } else {
        div.classList.add('hide');
        input.classList.remove('error');
      }
    })

    return valid;
  }

  bindEvents() {
    let form = document.querySelector('#contact-form');
    let searchBar = document.querySelector('#search-bar');

    document.addEventListener('click', (e) => {
      if (e.target.tagName === 'BUTTON' || e.target.tagName === 'A') {
        e.preventDefault();
      }

      if (e.target.matches('button.add')) {
        this.view.displayNewContactForm();

      } else if (e.target.matches('button.cancel')) {
        this.view.hideAndResetContactForm();

      } else if (e.target.matches('button.edit')) {
        let contactId = e.target.parentElement.dataset.id;
        this.loadEditForm(contactId);

      } else if (e.target.matches('button.delete')) {
        let contactId = e.target.parentElement.dataset.id;
        if (confirm('Are you sure you want to delete this contact?')) {
          this.model.deleteContact(contactId);
          this.loadList();
        }

      } else if (e.target.matches('button.delete-tag')) {
        this.view.removeTag(e);
      
      } else if (e.target.matches('button.add-tag')) {
        this.view.addTag(e);

      } else if (e.target.matches('button.show-all')) {
        this.view.showAllContacts();

      } else if (e.target.matches('a.tag')) {
        this.view.filterByTag(e.target.textContent);

      }
    });

    form.addEventListener('submit', async e => {
      e.preventDefault();

      let data = new FormData(form);
      let json = this.formDataToJson(data);

      let tagsList = document.querySelector('#tags-list');
      json.tags = tagsList.dataset.tags;
      
      if (this.validateContactForm(json)) {
        let response = await this.model.updateContact(json);
        if (response.status === 201) {
          this.view.hideAndResetContactForm();
          this.loadList();
        }
      }
    });

    searchBar.addEventListener('keyup', e => {
      let query = searchBar.value;
      
      if (query.length) {
        this.view.filterByName(query);
      } else {
        this.view.showAllContacts();
        this.view.hideEmptyQueryMessage();
      }
    })
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new ContactListController(new ContactListModel(), new ContactListView())
});