fetch('uploader.wasm').then(response => response.arrayBuffer()).then(function (bin) {
    document.getElementById('upload').onclick = function () {
        const go = new Go()
        WebAssembly.instantiate(bin, go.importObject).then((result) => {
            const reader = new FileReader();
            const files = document.getElementById('file').files
            if (files.length == 0) {
                alert('no file selected')
                return
            }
            document.getElementById('status').innerText = 'start uploading ...'
            const file = files[0]
            reader.readAsArrayBuffer(file)
            reader.onloadend = function (e) {
                var data = new Uint8Array(e.target.result)
                global.fs.read = function (fd, buffer, offset, length, position, callback) {
                    if (fd != 0) {
                        const err = new Error("not implemented");
                        err.code = "ENOSYS";
                        callback(err);
                        return
                    }
                    if (length > data.length) {
                        length = data.length
                    }
                    buffer.set(data.slice(0, length), offset)
                    data = data.slice(length)
                    callback(null, length)
                }
                let stdout = ""
                let stderr = ""
                const decoder = new TextDecoder("utf-8");
                global.fs.writeSync = function (fd, buf) {
                    switch (fd) {
                        case 1:
                            stdout += decoder.decode(buf)
                            document.getElementById('link').value = stdout
                            return buf.length
                        case 2:
                            stderr += decoder.decode(buf);
                            const nl = stderr.lastIndexOf("\n");
                            if (nl != -1) {
                                document.getElementById('status').innerText = stderr.substr(0, nl)
                                stderr = stderr.substr(nl + 1);
                            }
                            return buf.length
                    }
                }
                go.exit = (code) => {
                    if (code !== 0) {
                        alert("exit code:", code);
                        return
                    }
                    document.getElementById('status').innerText = 'uploaded, use the displayed link to download'
                };
                go.argv = ["NE0FS", "-i", "-f", file.name]
                go.run(result.instance);
            }
        });
    }
    document.getElementById('upload').disabled = false
});

fetch('downloader.wasm').then(response => response.arrayBuffer()).then(function (bin) {
    document.getElementById('download').onclick = function () {
        const addr = document.getElementById('link').value
        if (addr.substr(0, 8) != "ne0fs://") {
            alert('not a ne0fs link')
            return
        }
        document.getElementById('status').innerText = 'start downloading ...'
        const url = new URL('https://' + addr.substr(8))
        const go = new Go()
        WebAssembly.instantiate(bin, go.importObject).then((result) => {
            let stdout = new Uint8Array(0)
            let stderr = ""
            const decoder = new TextDecoder("utf-8");
            global.fs.writeSync = function (fd, buf) {
                switch (fd) {
                    case 1:
                        let last = stdout
                        stdout = new Uint8Array(last.length + buf.length)
                        stdout.set(last)
                        stdout.set(buf, last.length)
                        return buf.length
                    case 2:
                        stderr += decoder.decode(buf);
                        const nl = stderr.lastIndexOf("\n");
                        if (nl != -1) {
                            console.log(stderr.substr(0, nl))
                            document.getElementById('status').innerText = stderr.substr(0, nl)
                            stderr = stderr.substr(nl + 1);
                        }
                        return buf.length
                }
            }

            go.argv = ["NE0FS", "-l", addr, "-o"]
            go.exit = (code) => {
                if (code !== 0) {
                    alert("exit code:", code);
                    return
                }
                let a = document.createElement("a");
                document.body.appendChild(a);
                a.style = "display: none";
                let blob = new Blob([stdout], { type: 'octet/stream' })
                let expr = window.URL.createObjectURL(blob)
                a.href = expr
                a.download = url.pathname.split('/').pop();
                a.click();
                window.URL.revokeObjectURL(url);
                document.getElementById('status').innerText = 'downloaded'
            };
            go.run(result.instance);
        });
    }
    document.getElementById('download').disabled = false
});

document.getElementById('copy').onclick = function () {
    document.getElementById('link').focus()
    document.getElementById('link').select()
    document.getElementById('link').setSelectionRange(0, 0x1000)
    document.execCommand("copy");
}

document.getElementById('copy').disabled = false