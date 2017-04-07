package main

import (
	"encoding/json"
	"flag"
	"io"
	"log"
	"net/http"
	"strings"

	"github.com/gorilla/mux"
)

var staticEtag = flag.String("staticEtag", "", "A static etag value.")
var staticPath = flag.String("static", "static/", "Path to the static content")

func staticFileRouter() *mux.Router {
	r := mux.NewRouter()
	r.StrictSlash(true)

	// static
	r.PathPrefix("/static/").Handler(http.StripPrefix("/static/",
		myFileHandler{http.FileServer(http.Dir(*staticPath))}))

	// application pages
	appPages := []string{
		"/search",
	}

	for _, p := range appPages {
		// if you try to use index.html it will redirect...poorly
		r.PathPrefix(p).Handler(RewriteURL("/",
			http.FileServer(http.Dir(*staticPath))))
	}

	r.Handle("/", http.RedirectHandler("/static/index.html", 302))
	r.Handle("/js/handlebars.js", http.RedirectHandler("/static/js/handlebars.js", 302))
	r.Handle("/js/search.js", http.RedirectHandler("/static/js/search.js", 302))
	r.Handle("/img/hugo.png", http.RedirectHandler("/static/img/hugo.png", 302))
	r.Handle("/img/bleve-icon-placard-small.png", http.RedirectHandler("/static/img/bleve-icon-placard-small.png", 302))

	return r
}

type myFileHandler struct {
	h http.Handler
}

func (mfh myFileHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if *staticEtag != "" {
		w.Header().Set("Etag", *staticEtag)
	}
	mfh.h.ServeHTTP(w, r)
}

func RewriteURL(to string, h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		r.URL.Path = to
		h.ServeHTTP(w, r)
	})
}

func mustEncode(w io.Writer, i interface{}) {
	if headered, ok := w.(http.ResponseWriter); ok {
		headered.Header().Set("Cache-Control", "no-cache")
		headered.Header().Set("Content-type", "application/json")
	}

	e := json.NewEncoder(w)
	if err := e.Encode(i); err != nil {
		panic(err)
	}
}

func ShowError(w http.ResponseWriter, r *http.Request,
	msg string, code int) {
	log.Printf("rest: error code: %d, msg: %s", code, msg)
	http.Error(w, msg, code)
}

func singleJoiningSlash(a, b string) string {
	aslash := strings.HasSuffix(a, "/")
	bslash := strings.HasPrefix(b, "/")
	switch {
	case aslash && bslash:
		return a + b[1:]
	case !aslash && !bslash:
		return a + "/" + b
	}
	return a + b
}
