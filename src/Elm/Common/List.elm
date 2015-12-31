module Common.List where


break : (a -> Bool) -> List a -> Maybe (List a, a, List a)
break match list =
    let
      accumulate unmatched things =
          case things of
            [] ->
              Nothing
            (thing :: moreThings) ->
              if match thing
                then Just (List.reverse unmatched, thing, moreThings)
                else accumulate (thing :: unmatched) moreThings
    in
      accumulate [] list


nth : Int -> List a -> Maybe a
nth n things =
    case things of
      [] ->
        Nothing
      (thing :: moreThings) ->
        if n < 0
          then Nothing
          else if n == 0
            then Just thing
            else nth (n - 1) moreThings
