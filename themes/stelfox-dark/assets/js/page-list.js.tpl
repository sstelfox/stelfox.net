{{- $regular := where .Site.RegularPages "Section" "in" (slice "blog" "notes" "projects") -}}
{{- $bundles := slice -}}
{{- range .Site.Pages -}}
  {{- if and .IsSection (in (slice "blog" "notes" "projects") .FirstSection.Section) (gt (len .RawContent) 0) (not (eq .Kind "home")) -}}
    {{- $bundles = $bundles | append . -}}
  {{- end -}}
{{- end -}}
{{- $pages := union $regular $bundles -}}
window.__pageList = [
{{- range $index, $page := $pages -}}
{{- if $index }},{{ end }}{{ $page.RelPermalink | jsonify }}
{{- end -}}
];
