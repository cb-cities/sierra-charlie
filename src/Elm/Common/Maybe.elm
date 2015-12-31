module Common.Maybe where


firstAndThen : (a -> Maybe b) -> (b -> Maybe c) -> a -> Maybe c
firstAndThen first next thing =
    case first thing of
      Nothing ->
        Nothing
      Just something ->
        next something
