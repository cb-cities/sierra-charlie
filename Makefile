# NOTE: This Makefile can be executed in parallel.  For best results:
#
# export MAKEFLAGS=--no-builtin-rules --no-builtin-variables --warn-undefined-variables -j


project-name  := $(notdir $(CURDIR))
s3-bucket     := $(shell cat s3-bucket.txt 2>/dev/null)

SHELL := /usr/bin/env bash

.PHONY : all build clean dev watch pub sync open
all    : dev-watch
build  : dev-build pub-build
clean  : unwatch ; rm -rf out
dev    : dev-watch
watch  : dev-watch
pub    : pub-sync
sync   : pub-sync

define main-macro
  .PHONY        : $(mode)-build
  $(mode)-build : $(mode)-scripts $(mode)-stylesheets $(mode)-files
  $(mode)-clean : unwatch ; rm -rf out/$(mode)
endef
$(foreach mode,dev pub,$(eval $(main-macro)))

.DELETE_ON_ERROR :


# Utilities
# ---------

find-files = $(shell find -L $(1) -type f \( -false $(foreach pattern,$(2),-or -name '$(pattern)') \) 2>/dev/null)


# Publishing
# ----------

s3-args := sync out/pub/ s3://$(s3-bucket) --acl-public --no-preserve --exclude='*.git*'

define pub-sync-all
  s3cmd $(s3-args) --delete-removed
endef

.PHONY : pub-sync
pub-sync : unwatch
	$(MAKE) pub-build
	$(pub-sync-all)

.PHONY : pub-force-delete
pub-force-delete :
	s3cmd sync /dev/null s3://$(s3-bucket) --delete-removed --force


# Watching
# --------

# NOTE: The file system watching facility will not pick up the contents of newly symlinked directories, as `fswatch` does not automatically follow symlinks.

fswatch-roots := $(patsubst %,'%',$(realpath . $(shell find . -type l)))

fswatch-off     := pgrep -f 'fswatch.* --format-time pgrep/$(project-name)' | xargs kill
browsersync-off := pgrep -f 'browser-sync.* --files pgrep/$(project-name)' | xargs kill

.PHONY : unwatch
unwatch :
	-$(fswatch-off)
	-$(browsersync-off)

define watch-macro
  define $(mode)-watch
    $(fswatch-off)
    $(browsersync-off)
    fswatch --exclude='.*/out/.*' --one-per-batch --recursive $(fswatch-roots) --format-time pgrep/$(project-name) | xargs -n1 -I{} '$(MAKE)' $(mode)-build &
    ( while ps -p $$$${PPID} >/dev/null ; do sleep 1 ; done ; $(fswatch-off) ; $(browsersync-off) ) &
    browser-sync start --no-online --files 'out/$(mode)/**/*' --server 'out/$(mode)' --no-ghost-mode --no-notify --no-ui --files pgrep/$(project-name)
  endef

  .PHONY        : $(mode)-watch
  $(mode)-watch : $(mode)-build ; $$($(mode)-watch)
endef
$(foreach mode,dev pub,$(eval $(watch-macro)))


# Optimization
# ------------

dev-copy-optimized-css = cp $< $@
define pub-copy-optimized-css
  cleancss --s0 --skip-rebase $< >$@
endef


# Scripts
# -------

scripts := scripts/main.js $(call find-files,scripts,*.js)

dev-webpack-flags := --debug --output-pathinfo
pub-webpack-flags := --optimize-minimize --optimize-occurence-order

define scripts-macro
  define $(mode)-compile-js
    webpack --bail --define $(mode)=$(mode) $$($(mode)-webpack-flags) --config=webpack-config.js $$< $$@
  endef

  out/$(mode)/_scripts.js : $(scripts) webpack-config.js ; mkdir -p $$(@D) && $$($(mode)-compile-js)

  .PHONY          : $(mode)-scripts
  $(mode)-scripts : out/$(mode)/_scripts.js
endef
$(foreach mode,dev pub,$(eval $(scripts-macro)))


# Stylesheets
# -----------

stylesheets := stylesheets/main.sass $(call find-files,stylesheets,_*.sass _*.scss)

prefix-css = autoprefixer --browsers '> 1%, last 2 versions, Firefox ESR' --output $@ $<

define stylesheets-macro
  define $(mode)-compile-sass
    sass --cache-location out/tmp/$(mode)/.sass-cache --line-numbers --load-path stylesheets --sourcemap=none --style expanded $$< $$@
  endef

  out/tmp/$(mode)/stylesheets.css     : $(stylesheets)                      ; $$($(mode)-compile-sass)
  out/tmp/$(mode)/stylesheets.pre.css : out/tmp/$(mode)/stylesheets.css     ; $$(prefix-css)
  out/$(mode)/_stylesheets.css        : out/tmp/$(mode)/stylesheets.pre.css ; mkdir -p $$(@D) && $$($(mode)-copy-optimized-css)

  .PHONY              : $(mode)-stylesheets
  $(mode)-stylesheets : out/$(mode)/_stylesheets.css
endef
$(foreach mode,dev pub,$(eval $(stylesheets-macro)))


# Files
# -----

files      := $(patsubst files/%,%,$(call find-files,files,*))
file-roots := files files-dev files-pub

vpath %.bcmap $(file-roots)
vpath %.css   $(file-roots)
vpath %.eot   $(file-roots)
vpath %.html  $(file-roots)
vpath %.ico   $(file-roots)
vpath %.jpg   $(file-roots)
vpath %.js    $(file-roots)
vpath %.otf   $(file-roots)
vpath %.pdf   $(file-roots)
vpath %.png   $(file-roots)
vpath %.svg   $(file-roots)
vpath %.ttf   $(file-roots)
vpath %.woff  $(file-roots)
vpath %.woff2 $(file-roots)

define files-macro
  out/$(mode)/%.bcmap : %.bcmap ; mkdir -p $$(@D) && cp $$< $$@
  out/$(mode)/%.css   : %.css   ; mkdir -p $$(@D) && $$($(mode)-copy-optimized-css)
  out/$(mode)/%.eot   : %.eot   ; mkdir -p $$(@D) && cp $$< $$@
  out/$(mode)/%.html  : %.html  ; mkdir -p $$(@D) && cp $$< $$@
  out/$(mode)/%.ico   : %.ico   ; mkdir -p $$(@D) && cp $$< $$@
  out/$(mode)/%.jpg   : %.jpg   ; mkdir -p $$(@D) && cp $$< $$@
  out/$(mode)/%.js    : %.js    ; mkdir -p $$(@D) && cp $$< $$@
  out/$(mode)/%.otf   : %.otf   ; mkdir -p $$(@D) && cp $$< $$@
  out/$(mode)/%.pdf   : %.pdf   ; mkdir -p $$(@D) && cp $$< $$@
  out/$(mode)/%.png   : %.png   ; mkdir -p $$(@D) && cp $$< $$@
  out/$(mode)/%.svg   : %.svg   ; mkdir -p $$(@D) && cp $$< $$@
  out/$(mode)/%.ttf   : %.ttf   ; mkdir -p $$(@D) && cp $$< $$@
  out/$(mode)/%.woff  : %.woff  ; mkdir -p $$(@D) && cp $$< $$@
  out/$(mode)/%.woff2 : %.woff2 ; mkdir -p $$(@D) && cp $$< $$@

  .PHONY        : $(mode)-files
  $(mode)-files : $(addprefix out/$(mode)/,$(files) $(patsubst files-$(mode)/%,%,$(call find-files,files-$(mode),*)))
endef
$(foreach mode,dev pub,$(eval $(files-macro)))
