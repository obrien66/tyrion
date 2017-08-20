const fs = require("fs"),
	  qs = require("querystring")
	  http = require("http"),
	  data = require("./data")
      chalk = require("chalk"),
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
			<title>Redirect</title>
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
	return `<!doctype html><html><head><title>${code}</title></head><body>${code}: ${message}</body></html>`
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
	log(chalk.dim(time()) + " "+ chalk.blue(req.method) + " " + chalk.green(req.url));
	if (req.method == "GET") {
		if (req.url == "/") {
			res.writeHead(200, {"content-type": "text/html"})
			res.write("<h1>Here are the urls that have been shortened</h1><a href='/submit'>Submit a new one</a><ul style='list-style-type:none;'>")
			for (var i = 0; i < place.length; i++) {
				res.write(`<li>${links[i]} &rarr; <a href="${links[i]}">${place[i]}</a></li>`)
			}
			res.end("</ul>")
		}
		else if (req.url == "/submit"){
			fs.readFile("submit.html", (err, data) => {
				res.writeHead(404, "File Not Found", {"content-type": "text/html"})
				if (err) res.end(fail("404", "File Not Found"))
				else  {
					res.end(data)
				}
			})
		}
		else {
			let requested = req.url.substring(1)
			let find = links.indexOf(requested)
			if (find >= 0) {
				res.end(html(place[find]))
			}
			else {
				fs.readFile("goof.html", "utf8", (err, data) => {
					if (err){
						res.writeHead(404, "File Not Found", {"content-type": "text/html"})
						res.end(fail("404", "File Not Found"))
					}
					else {
						res.end(data)
					}
				});
			}
		}
	}
	else if (req.method == "POST") {
		if (req.method == "/send") {
			let body = ""
			req.on("data", (data) => {
				log("Post working...");
				body += data
				if(body.length > 1e6) {req.connection.destroy()}
			})
			req.on("end", () => {
				log("Post Worked!");
				let formData = qs.parse(body)
				links.push(formData.ext)
				place.push(formData.url)
				res.writeHead(200, {"content-type": "text/html"})
				res.end(`Thanks! <a href="${formData.ext}">http://localhost:8000/${formData.ext}</a> will point to <a href="${formData.url}">${formData.url}</a>`)
			})
		}
	}
	else {
		res.writeHead(405, "Method Not Supported", {"content-type": "text/html"})
		res.end(fail("405", "Method Not Supported"))
	}
}).listen(port)

log(chalk.bold(`http://localhost:${port}`))