{-

T.M. Nicholl, D.T. Lee, R.A. Nicholl, “An efficient new algorithm for 2D line clipping: Its development and analysis”, Computer Graphics, volume 21, number 4, July 1987

 left top      | centre top    | right top
---------------+---------------+---------------
 left middle   | centre middle | right middle
---------------+---------------+---------------
 left bottom   | centre bottom | right bottom

-}

module Accept
  ( Point (..)
  , Rect (..)
  , Line (..)
  , acceptAll
  , accept
  )
  where

import Data.Array
import Data.Maybe


type Point = { x :: Number
             , y :: Number
             }

type Line = { p1 :: Point
            , p2 :: Point
            }

type Rect = { xleft   :: Number
            , ytop    :: Number
            , xright  :: Number
            , ybottom :: Number
            }


-- Rotate point p 90° clockwise about the origin
rotatePoint90c :: Point -> Point
rotatePoint90c p = { x :  p.y
                   , y : -p.x
                   }

-- Rotate point p 180° clockwise about the origin
rotatePoint180c :: Point -> Point
rotatePoint180c p = { x : -p.x
                    , y : -p.y
                    }

-- Rotate point p 270° clockwise about the origin
rotatePoint270c :: Point -> Point
rotatePoint270c p = { x : -p.y
                    , y :  p.x
                    }

-- Reflect point p about the line x = -y
reflectPointXMinusY :: Point -> Point
reflectPointXMinusY p = { x : -p.y
                        , y : -p.x
                        }

-- Reflect point p about the x axis
reflectPointXAxis :: Point -> Point
reflectPointXAxis p = { x :  p.x
                      , y : -p.y
                      }


-- Rotate line l 90° clockwise about the origin
rotateLine90c :: Line -> Line
rotateLine90c l = { p1 : rotatePoint90c l.p1
                  , p2 : rotatePoint90c l.p2
                  }

-- Rotate line l 180° clockwise about the origin
rotateLine180c :: Line -> Line
rotateLine180c l = { p1 : rotatePoint180c l.p1
                   , p2 : rotatePoint180c l.p2
                   }

-- Rotate line l 270° clockwise about the origin
rotateLine270c :: Line -> Line
rotateLine270c l = { p1 : rotatePoint270c l.p1
                   , p2 : rotatePoint270c l.p2
                   }

-- Reflect line l about the line x = -y
reflectLineXMinusY :: Line -> Line
reflectLineXMinusY l = { p1 : reflectPointXMinusY l.p1
                       , p2 : reflectPointXMinusY l.p2
                       }

-- Reflect line l about the x axis
reflectLineXAxis :: Line -> Line
reflectLineXAxis l = { p1 : reflectPointXAxis l.p1
                     , p2 : reflectPointXAxis l.p2
                     }


-- Rotate rect r 90° clockwise about the origin
rotateRect90c :: Rect -> Rect
rotateRect90c r = { xleft   :  r.ybottom
                  , ytop    : -r.xleft
                  , xright  :  r.ytop
                  , ybottom : -r.xright
                  }

-- Rotate rect r 180° clockwise about the origin
rotateRect180c :: Rect -> Rect
rotateRect180c r = { xleft   : -r.xright
                   , ytop    : -r.ybottom
                   , xright  : -r.xleft
                   , ybottom : -r.ytop
                   }

-- Rotate rect r 270° clockwise about the origin
rotateRect270c :: Rect -> Rect
rotateRect270c r = { xleft   : -r.ytop
                   , ytop    :  r.xright
                   , xright  : -r.ybottom
                   , ybottom :  r.xleft
                   }

-- Reflect rect r about the line x = -y
reflectRectXMinusY :: Rect -> Rect
reflectRectXMinusY r = { xleft   : -r.ytop
                       , ytop    : -r.xleft
                       , xright  : -r.ybottom
                       , ybottom : -r.xright
                       }

-- Reflect rect r about the x axis
reflectRectXAxis :: Rect -> Rect
reflectRectXAxis r = { xleft   :  r.xleft
                     , ytop    : -r.ybottom
                     , xright  :  r.xright
                     , ybottom : -r.ytop
                     }


delta :: Line -> Point
delta l = { x : l.p2.x - l.p1.x
          , y : l.p2.y - l.p1.y
          }

leftProduct :: Rect -> Line -> Point -> Number
leftProduct r l d = (r.xleft - l.p1.x) * d.y

topProduct :: Rect -> Line -> Point -> Number
topProduct r l d = (r.ytop - l.p1.y) * d.x

bottomProduct :: Rect -> Line -> Point -> Number
bottomProduct r l d = (r.ybottom - l.p1.y) * d.x


acceptAll :: Rect -> Array Line -> Array Line
acceptAll r ls = filter (accept r) ls

-- Clip line l to rect r
accept :: Rect -> Line -> Boolean
accept r l | l.p1.x < r.xleft  = _p1Left r l
           | l.p1.x > r.xright = _p1Left (rotateRect180c r) (rotateLine180c l)
           | otherwise         = _p1Centre r l

-- 1. "leftcolumn"
-- P1 is in one of the left regions
_p1Left :: Rect -> Line -> Boolean
_p1Left r l | l.p2.x < r.xleft   = false
            | l.p1.y > r.ytop    = _p1LeftTop_p2NotLeft r l
            | l.p1.y < r.ybottom = _p1LeftTop_p2NotLeft (reflectRectXAxis r) (reflectLineXAxis l)
            | otherwise          = _p1LeftMiddle_p2NotLeft r l

-- 1.1. "topleftcorner"
-- P1 is in the left-top region, and P2 is not in any of the left regions
_p1LeftTop_p2NotLeft :: Rect -> Line -> Boolean
_p1LeftTop_p2NotLeft r l | l.p2.y > r.ytop = false
                         | otherwise       = let d = delta l in
                                             _p1LeftTop_p2NotLeftTop r l d (topProduct r l d) (leftProduct r l d)

-- P1 is in the left-top region, and P2 is not in any of the left or top regions
_p1LeftTop_p2NotLeftTop :: Rect -> Line -> Point -> Number -> Number -> Boolean
_p1LeftTop_p2NotLeftTop r l d topp leftp | topp > leftp = _p1LeftTop_p2NotLeftTop' r l d leftp
                                         | otherwise    = _p1LeftTop_p2NotLeftTop' (reflectRectXMinusY r) (reflectLineXMinusY l) (reflectPointXMinusY d) topp

-- 1.1.1. "leftbottomregion"
-- P1 is in the left-top region, and P2 is not in any of the left or top regions, and above the vector from P1 to the left-top corner
_p1LeftTop_p2NotLeftTop' :: Rect -> Line -> Point -> Number -> Boolean
_p1LeftTop_p2NotLeftTop' r l d leftp | l.p2.y < r.ybottom = _p1LeftTop_p2Bottom r l d leftp (bottomProduct r l d)
                                     | otherwise          = true

-- P1 is in the left-top region, and P2 is in the centre-bottom or right-bottom region
_p1LeftTop_p2Bottom :: Rect -> Line -> Point -> Number -> Number -> Boolean
_p1LeftTop_p2Bottom r l d leftp bottomp | bottomp > leftp = false
                                        | otherwise       = true

-- 1.2. "leftedge"
-- P1 is in the left-middle region, and P2 is not in any of the left regions
_p1LeftMiddle_p2NotLeft :: Rect -> Line -> Boolean
_p1LeftMiddle_p2NotLeft r l | l.p2.y < r.ybottom = _p1LeftMiddle_p2BottomNotLeft r l
                            | l.p2.y > r.ytop    = _p1LeftMiddle_p2BottomNotLeft (reflectRectXAxis r) (reflectLineXAxis l)
                            | otherwise          = true

-- 1.2.1. "p2bottom"
-- P1 is in the left-middle region, and P2 is in the centre-bottom or right-bottom region
_p1LeftMiddle_p2BottomNotLeft :: Rect -> Line -> Boolean
_p1LeftMiddle_p2BottomNotLeft r l = let d = delta l in
                                    _p1LeftMiddle_p2BottomNotLeft' r l d (leftProduct r l d) (bottomProduct r l d)

_p1LeftMiddle_p2BottomNotLeft' :: Rect -> Line -> Point -> Number -> Number -> Boolean
_p1LeftMiddle_p2BottomNotLeft' r l d leftp bottomp | bottomp > leftp = false
                                                   | otherwise       = true

-- 2. "centrecolumn"
-- P1 is in one of the centre regions
_p1Centre :: Rect -> Line -> Boolean
_p1Centre r l | l.p1.y < r.ybottom = _p1CentreBottom r l
              | l.p1.y > r.ytop    = _p1CentreTop r l
              | otherwise          = true

-- P1 is in the centre-bottom region
_p1CentreBottom :: Rect -> Line -> Boolean
_p1CentreBottom r l | l.p2.y < r.ybottom = false
                    | otherwise          = _p1LeftMiddle_p2NotLeft (rotateRect90c r) (rotateLine90c l)

-- P1 is in the centre-top region
_p1CentreTop :: Rect -> Line -> Boolean
_p1CentreTop r l | l.p2.y > r.ytop = false
                 | otherwise       = _p1LeftMiddle_p2NotLeft (rotateRect270c r) (rotateLine270c l)
