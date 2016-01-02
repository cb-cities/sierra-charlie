module Common.Quadtree where

import Common.Point exposing (Point)
import Common.Rect as Rect exposing (Rect)


type alias Quadtree a =
  { left : Float
  , top : Float
  , size : Float
  , node : Node a
  }


type Node a =
    Leaf (Items a)
  | Branch
      { topLeft : Quadtree a
      , topRight : Quadtree a
      , bottomLeft : Quadtree a
      , bottomRight : Quadtree a
      }


type alias Items a =
    List (Item a)


type alias Item a =
    (Point, a)


maxItems : Int
maxItems = 1


empty : Float -> Float -> Float -> Quadtree a
empty left top size =
    { left = left
    , top = top
    , size = size
    , node = Leaf []
    }


split : Float -> Float -> Float -> Items a -> Quadtree a
split left top size items =
    let
      halfSize = size / 2
      midWidth = left + halfSize
      midHeight = top + halfSize
      emptyTree =
        { left = left
        , top = top
        , size = size
        , node =
            Branch
              { topLeft = empty left top halfSize
              , topRight = empty midWidth top halfSize
              , bottomLeft = empty left midHeight halfSize
              , bottomRight = empty midWidth midHeight halfSize
              }
        }
    in
      List.foldl insert emptyTree items


insert : Item a -> Quadtree a -> Quadtree a
insert (p, thing) tree =
    let
      continue = insert (p, thing)
    in
      case tree.node of
        Leaf items ->
          if List.length items < maxItems
            then {tree | node = Leaf ((p, thing) :: items)}
            else continue (split tree.left tree.top tree.size items)
        Branch branch ->
          let
            newBranch =
              if branch.topLeft `contains` p
                then {branch | topLeft = continue branch.topLeft}
                else if branch.topRight `contains` p
                  then {branch | topRight = continue branch.topRight}
                  else if branch.bottomLeft `contains` p
                    then {branch | bottomLeft = continue branch.bottomLeft}
                    else if branch.bottomRight `contains` p
                      then {branch | bottomRight = continue branch.bottomRight}
                      else branch
          in
            {tree | node = Branch newBranch}


select : Rect -> Quadtree a -> Items a
select rect tree =
    let
      continue = select rect
    in
      if tree `intersects` rect
        then case tree.node of
          Leaf items ->
            List.filter (\(p, _) -> rect `Rect.contains` p) items
          Branch branch ->
            continue branch.topLeft ++
              continue branch.topRight ++
              continue branch.bottomLeft ++
              continue branch.bottomRight
        else []


contains : Quadtree a -> Point -> Bool
contains tree p =
    tree.left <= p.x &&
    p.x <= tree.left + tree.size &&
    tree.top <= p.y &&
    p.y <= tree.top + tree.size


intersects : Quadtree a -> Rect -> Bool
intersects tree rect =
    tree.left <= rect.right &&
    rect.left <= tree.left + tree.size &&
    tree.top <= rect.bottom &&
    rect.top <= tree.top + tree.size
