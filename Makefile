install:
	npm ci

test:
	npm test

test-coverage:
	npm test -- --coverage

lint:
	npx oxlint && npx oxfmt --check

lint-fix:
	npx oxfmt && npx oxlint --fix

.PHONY: install test test-coverage lint lint-fix
