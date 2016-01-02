module Common.Zipper where
  
import Maybe exposing (andThen)

import Common.List exposing (break)
import Common.Maybe exposing (firstAndThen)


type alias Key =
  String


type Tree a b =
    Leaf Key a
  | Branch Key b (List (Tree a b))


keyOf : Tree a b -> Key
keyOf tree =
    case tree of
      Leaf key _ -> key
      Branch key _ _ -> key


matchKey : Key -> Tree a b -> Bool
matchKey targetKey tree =
    keyOf tree == targetKey


type Crumb a b =
  Crumb Key b (List (Tree a b)) (List (Tree a b))


type alias Crumbs a b =
  List (Crumb a b)


type Zipper a b =
  Zipper (Tree a b) (Crumbs a b)


goInto : Key -> Zipper a b -> Maybe (Zipper a b)
goInto targetKey (Zipper tree crumbs) =
    case tree of
      Leaf _ _ ->
        Nothing
      Branch key value subtrees ->
        case break (matchKey targetKey) subtrees of
          Nothing ->
            Nothing
          Just (subtrees1, targetSubtree, subtrees2) ->
            Just (Zipper targetSubtree ((Crumb key value subtrees1 subtrees2) :: crumbs))


goOut : Zipper a b -> Maybe (Zipper a b)
goOut (Zipper tree crumbs) =
    case crumbs of
      [] ->
        Nothing
      (Crumb key value subtrees1 subtrees2 :: crumbs) ->
        Just (Zipper (Branch key value (subtrees1 ++ [tree] ++ subtrees2)) crumbs)


type Step =
    GoInto Key
  | GoOut


type alias Steps =
  List Step


followStep : Step -> Zipper a b -> Maybe (Zipper a b)
followStep step =
    case step of
      GoInto targetKey -> goInto targetKey
      GoOut -> goOut


followSteps : Steps -> Zipper a b -> Maybe (Zipper a b)
followSteps steps =
    let
      accumulate step followPath =
          followPath `firstAndThen` followStep step
    in
      List.foldl accumulate Just steps
