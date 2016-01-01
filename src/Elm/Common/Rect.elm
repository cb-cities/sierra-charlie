module Common.Rect where

import Common.Point exposing (Point)


type alias Rect =
  { left : Float
  , top : Float
  , right : Float
  , bottom : Float
  }


width : Rect -> Float
width rect =
    rect.right - rect.left


height : Rect -> Float
height rect =
    rect.bottom - rect.top


contains : Rect -> Point -> Bool
contains rect p =
    rect.left <= p.x &&
    p.x <= rect.right &&
    rect.top <= p.y &&
    p.y <= rect.bottom


intersects : Rect -> Rect -> Bool
intersects rect1 rect2 =
    rect1.left <= rect2.right &&
    rect2.left <= rect1.right &&
    rect1.top <= rect2.bottom &&
    rect2.top <= rect1.bottom
