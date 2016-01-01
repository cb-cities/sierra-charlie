module Common.Maybe where


maybe : b -> (a -> b) -> Maybe a -> b
maybe fallback step unknown =
    case unknown of
      Nothing ->
        fallback
      Just something ->
        step something


firstAndThen : (a -> Maybe b) -> (b -> Maybe c) -> a -> Maybe c
firstAndThen firstStep nextStep thing =
    case firstStep thing of
      Nothing ->
        Nothing
      Just something ->
        nextStep something
