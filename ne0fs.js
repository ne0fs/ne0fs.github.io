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
                                document.getElementById('status').innerText = stderr
                                stderr = stderr.substr(nl + 1);
                            }
                            return buf.length
                    }
                }
                go.argv = ["NE0FS", "-i"]
                go.run(result.instance);
            }
        });
    }
    document.getElementById('upload').disabled = false
});

fetch('downloader.wasm').then(response => response.arrayBuffer()).then(function (bin) {
    document.getElementById('download').onclick = function () {
        const go = new Go()
        WebAssembly.instantiate(bin, go.importObject).then((result) => {
            const reader = new FileReader();
            const files = document.getElementById('file').files
            if (files.length == 0) {
                alert('no file selected')
                return
            }
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
                                document.getElementById('status').innerText = stderr
                                stderr = stderr.substr(nl + 1);
                            }
                            return buf.length
                    }
                }
                go.argv = ["NE0FS", "-i"]
                go.run(result.instance);
            }
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