<script id="contacts" type="text/x-handlebars">
 {{#each contacts}}
      {{> contact}}
    {{each}}
</script>

<script id="contact" data-type="partial" type="text/x-handlebars">
    <div id="contact-{{id}}">
      <h3>{{fullName}}</h3>
      <p><b>Phone Number:</b></p>
      <p>{{phoneNumber}}</p>
      <p><b>Email:</b></p>
      <p>{{email}}</p>
      <button class="edit">Edit</button>
      <button class="delete">Delete</button>
    </div>
 </script>