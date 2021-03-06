const fs = require("fs"),
	  querystring = require("querystring"),
	  http = require("http"),
	  data = require("./data"),
      colour = require("./colour"),
      log = console.log,
      port = data.port
// Make both smaller names and mutable
var links = data.link
var place = data.where
// HTML for redirect
var html = function(place){
	return `
		<!DOCTYPE html>
		<html>
			<head>
			<title>${place}</title>
		</head>
		<body>
		Redirecting to ${place}
		<script type="text/javascript">
			window.location.replace("${place}")
		</script>
		</body>
		</html>
		`
}
// HTML for failure
var fail = function(code, message){
	return `<!DOCTYPE html>
	<html>
		<head>
		<title>${code}</title>
	</head>
	<body>
		<h1>${code}: ${message}</h1>
	</body>
	</html>
	`
}
var taken = function(ext){
	return `
		<!DOCTYPE html>
		<html>
			<head>
				<title>${ext} seems to be taken</title>
			</head>
			<body>
				<h3>It appears that url (${ext}) is unavailable. Maybe <a href="/submit">try another</a>?</h3>
			</body>
		</html>
	`
}
var thanks = function(ext, link){
	return `Thanks! <a href="${ext}">http://localhost:8000/${ext}</a> will point to <a href="${link}">${link}</a><br><br><a href="/">home</a>`
}
// Time for CLI
var time = function(){
	let d = new Date()
	let times = [d.getHours(), d.getMinutes(), d.getSeconds()]
	let done
	for (var i = 0; i < times.length; i++) {
		let string = String(times[i])
		if (string.length < 2) {
			string = "0" + string
		}
		if (i < 2) {
			string += ":"
		}
		done += string
	}
	return done.substring(9)
}

http.createServer((req, res) => {
	// Show time, http method, and requested URL
	log(colour.dim(time()) + " "+ colour.blue(req.method) + " " + colour.green(req.url));
	// If it's a get request
	if (req.method == "GET") {
		// And if it's to the root directory
		if (req.url == "/") {
			// Show the welcome and available shortened links
			res.writeHead(200, {"content-type": "text/html"})
			res.write("<h1>Here are the urls that have been shortened</h1><a href='/submit'>Submit a new one</a><ul style='list-style-type:none;'>")
			for (var i = 0; i < place.length; i++) {
				res.write(`<li>${links[i]} &rarr; <a href="${links[i]}">${place[i]}</a></li>`)
			}
			res.end("</ul>")
		}
		// If the users requests the "submit new url" page
		else if (req.url == "/submit"){
			// Read submit page
			fs.readFile("submit.html", (err, data) => {
				// if theres and error send 404 error and 404 page
				if (err){
					res.writeHead(404, "File Not Found", {"content-type": "text/html"})
					res.end(fail("404", "File Not Found"))
				}
				// Otherwise send a 200 response and the page
				else  {
					res.writeHead(200, {"content-type": "text/html"})
					res.end(data)
				}
			})
		}
		else if (req.url == "/main.css"){
			res.readFiile("main.css", (err, data) => {
				if (err) {
					res.writeHead(404, "File Not Found", {"content-type": "text/html"})
					res.end(fail("404", "File Not Found"))
				}
				else {
					res.writeHead(200, {"content-type": "text/html"})
					res.end(data)
				}
			})
		}
		else {
			// Cut out the / of the requested url
			let requested = req.url.substring(1)
			// Use that to find the shortened url that the user wants
			let find = links.indexOf(requested)
			// if it's found
			if (find >= 0) {
				// Serve it to them hot and fresh using the html redirect function above
				res.end(html(place[find]))
			}
			else {
				// If the url isn't one I have send them the page to show them they messed up
				fs.readFile("goof.html", "utf8", (err, data) => {
					if (err){
						// If there's an error send 404 response and 404 page
						res.writeHead(404, "File Not Found", {"content-type": "text/html"})
						res.end(fail("404", "File Not Found"))
					}
					// Otherwise it's gooda and send the page
					else {
						res.writeHead(200, {"content-type": "text/html"})
						res.end(data)
					}
				});
			}
		}
	}
	// If the method is post
	else if (req.method == "POST" && req.url == "/post") {
		let body = ""
		// Take chuncks and save them in data
		req.on("data", (data) => {
			if(body.length > 1e6) {req.connection.destroy()}
			// log("Post working...")
			body += data
		})
		// When we have the data
		req.on("end", () => {
			// log("Post Worked!")
			// Parse the query string
			let formData = querystring.parse(body)

			res.writeHead(200, {"content-type": "text/html"})

			if (links.indexOf(formData.ext) != -1){
				res.end(taken(formData.ext))
			}
			else {
				// Save the link and the extension
				links.push(formData.ext)
				place.push(formData.url)
				// Respond nicely
				res.end(thanks(formData.ext, formData.url))
			}


		})
	}
	// If they use a weird method say no thanks
	else {
		res.writeHead(405, "Method Not Supported", {"content-type": "text/html"})
		res.end(fail("405", "Method Not Supported"))
	}
}).listen(port)

log(colour.bold(`http://localhost:${port}`))