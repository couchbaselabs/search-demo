package main

import (
	"flag"
	"log"
	"net/http"
	"net/http/httputil"
)

var bindAddr = flag.String("addr", ":8099", "http listen address")

var proxyScheme = flag.String("proxyScheme", "http", "proxy scheme")
var proxyUser = flag.String("proxyUser", "Administrator", "proxy user")
var proxyPass = flag.String("proxyPass", "password", "proxy pass")
var proxyHost = flag.String("proxyHost", "localhost:9200", "proxy host")
var proxyPath = flag.String("proxyPath", "/", "proxy path")
var proxyQuery = flag.String("proxyQuery", "", "proxy query")

func main() {
	flag.Parse()

	// start server
	startServer(*bindAddr)
}

func proxyDirector() func(req *http.Request) {
	director := func(req *http.Request) {
		req.URL.Scheme = *proxyScheme
		req.URL.Host = *proxyHost
		req.URL.Path = singleJoiningSlash(*proxyPath, req.URL.Path)
		if *proxyQuery == "" || req.URL.RawQuery == "" {
			req.URL.RawQuery = *proxyQuery + req.URL.RawQuery
		} else {
			req.URL.RawQuery = *proxyQuery + "&" + req.URL.RawQuery
		}
		if _, ok := req.Header["User-Agent"]; !ok {
			// explicitly disable User-Agent so it's not set to default value
			req.Header.Set("User-Agent", "")
		}
		if *proxyUser != "" {
			req.SetBasicAuth(*proxyUser, *proxyPass)
		}
	}
	return director
}

func startServer(addr string) {
	// create a router to serve static files
	router := staticFileRouter()

	// proxy api requests to couchbase fts
	proxy := &httputil.ReverseProxy{Director: proxyDirector()}
	http.Handle("/api/", proxy)

	http.Handle("/", router)
	log.Printf("Listening on %v", addr)
	log.Fatal(http.ListenAndServe(addr, nil))
}
