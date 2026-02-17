# Contributing

## Testing without publishing

```sh
npm link
npm exec tsdown -- -w

# In an other repo:
npm link pg-typesafe
```

## Running the test suite

You need a postgresql instance running on localhost:5432. The test suite will not modify the databases. You can run one with docker:

```sh
docker run --rm -e POSTGRES_PASSWORD=example -d postgres
```
