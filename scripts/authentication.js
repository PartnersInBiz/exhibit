(() => {
	if (typeof document.getElementsByName("login")[0] != "undefined")
	{
		document.getElementsByName("login")[0].addEventListener("submit", (e) => {
			e.preventDefault();

			// Get data
			let data = {
				email: document.getElementById("email").value,
				password: document.getElementById("password").value,
				ajax: true
			};

			// Validate form
			const required = ["email", "password"];
			if (validateForm(data, required))
			{
				let always = (xhr) => {
					if (xhr.status == 301)
						window.location = xhr.responseText;
					else if (xhr.status == 400)
						$(".alert").html(xhr.responseText).removeClass("d-none");
				};

				$.post("/login", data).always(always);
			}
			else
			{
				$(".alert").html("The input provided was invalid. Make sure you have followed the instructions for each field.").removeClass("d-none");
			}
		});
	}

	if (typeof document.getElementsByName("register")[0] != "undefined")
	{
		document.getElementsByName("register")[0].addEventListener("submit", (e) => {
			e.preventDefault();

			// Get data
			let data = {
				first_name: document.getElementById("first_name").value,
				last_name: document.getElementById("last_name").value,
				display_name: document.getElementById("display_name").value,
				email: document.getElementById("email").value,
				password: document.getElementById("password").value,
				ajax: true
			};

			// Validate form
			const required = ["first_name", "last_name", "email", "password"];
			if (validateForm(data, required))
			{
				let always = (xhr) => {
					if (xhr.status == 301)
						window.location = xhr.responseText;
					else if (xhr.status == 400)
						$(".alert").html(xhr.responseText).removeClass("d-none");
				};

				$.post("/register", data).always(always);
			}
			else
			{
				$(".alert").html("The input provided was invalid. Make sure you have followed the instructions for each field.").removeClass("d-none");
			}
		});
	}
})();