package main

import (
	"encoding/json"
	"regexp"
	"sort"
	"strings"
	"syscall/js"
)

type entry struct {
	Title    string `json:"title"`
	URL      string `json:"url"`
	CourseID string `json:"courseId"`
}

type resultGroup struct {
	Code    string  `json:"code"`
	Matches []entry `json:"matches"`
}

var (
	codePattern     = regexp.MustCompile(`(?i)[a-z]{3}\s*[0-9]{4}`)
	courseIDPattern = regexp.MustCompile(`[?&]course_id=([^&]+)`)
	indexByCode     = make(map[string][]entry)
	retainedFuncs   []js.Func
)

func normalizeCode(value string) string {
	return strings.ToUpper(strings.Join(strings.Fields(value), ""))
}

func buildIndex(_ js.Value, args []js.Value) any {
	indexByCode = make(map[string][]entry)
	if len(args) == 0 {
		return 0
	}

	for _, line := range strings.Split(args[0].String(), "\n") {
		line = strings.TrimSpace(strings.TrimSuffix(line, "\r"))
		parts := strings.SplitN(line, " -> ", 2)
		if len(parts) != 2 {
			continue
		}

		title := strings.TrimSpace(parts[0])
		url := strings.TrimSpace(parts[1])
		courseID := ""
		if found := courseIDPattern.FindStringSubmatch(url); len(found) == 2 {
			courseID = found[1]
		}
		item := entry{Title: title, URL: url, CourseID: courseID}

		seenCodes := make(map[string]bool)
		for _, rawCode := range codePattern.FindAllString(title, -1) {
			code := normalizeCode(rawCode)
			if seenCodes[code] {
				continue
			}
			seenCodes[code] = true
			indexByCode[code] = append(indexByCode[code], item)
		}
	}

	return len(indexByCode)
}

func searchIndex(_ js.Value, args []js.Value) any {
	if len(args) == 0 {
		return "[]"
	}

	var requested []string
	if err := json.Unmarshal([]byte(args[0].String()), &requested); err != nil {
		return "[]"
	}

	groups := make([]resultGroup, 0, len(requested))
	seenQueries := make(map[string]bool)
	for _, rawCode := range requested {
		code := normalizeCode(rawCode)
		if code == "" || seenQueries[code] {
			continue
		}
		seenQueries[code] = true

		matches := indexByCode[code]
		unique := make([]entry, 0, len(matches))
		seenURLs := make(map[string]bool)
		for _, item := range matches {
			if seenURLs[item.URL] {
				continue
			}
			seenURLs[item.URL] = true
			unique = append(unique, item)
		}
		sort.SliceStable(unique, func(i, j int) bool {
			return unique[i].CourseID > unique[j].CourseID
		})
		groups = append(groups, resultGroup{Code: code, Matches: unique})
	}

	encoded, err := json.Marshal(groups)
	if err != nil {
		return "[]"
	}
	return string(encoded)
}

func expose(name string, fn func(js.Value, []js.Value) any) {
	wrapped := js.FuncOf(fn)
	retainedFuncs = append(retainedFuncs, wrapped)
	js.Global().Set(name, wrapped)
}

func main() {
	expose("courseCodeBuildIndex", buildIndex)
	expose("courseCodeSearch", searchIndex)
	js.Global().Set("courseCodeSearchReady", true)
	select {}
}
