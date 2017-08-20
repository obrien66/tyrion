const fs = require("fs"),
	  qs = require("querystring")
	  http = require("http"),
	  data = require("./data")
      chalk = require("chalk"),
      log = console.log,
      port = data.port

let links = data.link
let place = data.where

var html = function(place){
	return `
		<!DOCTYPE html>
		<html>
			<head>
			<title>Redirect</title>
		</head>
		<body>
		Redirecting...
		<script type="text/javascript">
			window.location.replace("${place}")
		</script>
		</body>
		</html>
		`
}

var fail = function(code, message){
	return `<!doctype html><html><head><title>${code}</title></head><body>${code}: ${message}</body></html>`
}
var time = function(){
	let d = new Date()
	let times = [d.getHours(), d.getMinutes(), d.getSeconds()]
	times.map(function(item){
		let zero = ""
		if (item < 10) zero = "0"
		return zero + String(item)
	})
	return times.join(":")
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
				body += data
				if(body.length > 1e7) {
			        res.writeHead(413, 'Request Entity Too Large', {'Content-Type': 'text/html'});
			        res.end(fail("413", "Request Entity Too Large"));
        		}
			})
			req.on("end", () => {
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