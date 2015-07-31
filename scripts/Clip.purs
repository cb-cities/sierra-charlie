{-

T.M. Nicholl, D.T. Lee, R.A. Nicholl, “An efficient new algorithm for 2D line clipping: Its development and analysis”, Computer Graphics, volume 21, number 4, July 1987

 left top      | centre top    | right top
---------------+---------------+---------------
 left middle   | centre middle | right middle
---------------+---------------+---------------
 left bottom   | centre bottom | right bottom

-}

module Clip
  ( Point (..)
  , Rect (..)
  , Line (..)
  , clipAll
  , clip
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

rightProduct :: Rect -> Line -> Point -> Number
rightProduct r l d = (r.xright - l.p1.x) * d.y

bottomProduct :: Rect -> Line -> Point -> Number
bottomProduct r l d = (r.ybottom - l.p1.y) * d.x


clipTop :: Rect -> Line -> Point -> Number -> Point
clipTop r l d topp = { x : l.p1.x + topp / d.y
                     , y : r.ytop
                     }

clipBottom :: Rect -> Line -> Point -> Number -> Point
clipBottom r l d bottomp = { x : l.p1.x + bottomp / d.y
                           , y : r.ybottom
                           }

clipLeft :: Rect -> Line -> Point -> Number -> Point
clipLeft r l d leftp = { x : r.xleft
                       , y : l.p1.y + leftp / d.x
                       }

clipRight :: Rect -> Line -> Point -> Number -> Point
clipRight r l d rightp = { x : r.xright
                         , y : l.p1.y + rightp / d.x
                         }

clipAll :: Rect -> Array Line -> Array Line
clipAll r ls = catMaybes $ map (clip r) ls

-- Clip line l to rect r
clip :: Rect -> Line -> Maybe Line
clip r l | l.p1.x < r.xleft  = _p1Left r l
         | l.p1.x > r.xright = rotateLine180c <$> _p1Left (rotateRect180c r) (rotateLine180c l)
         | otherwise         = _p1Centre r l

-- 1. "leftcolumn"
-- P1 is in one of the left regions
_p1Left :: Rect -> Line -> Maybe Line
_p1Left r l | l.p2.x < r.xleft   = Nothing
            | l.p1.y > r.ytop    = _p1LeftTop_p2NotLeft r l
            | l.p1.y < r.ybottom = reflectLineXAxis <$> _p1LeftTop_p2NotLeft (reflectRectXAxis r) (reflectLineXAxis l)
            | otherwise          = _p1LeftMiddle_p2NotLeft r l

-- 1.1. "topleftcorner"
-- P1 is in the left-top region, and P2 is not in any of the left regions
_p1LeftTop_p2NotLeft :: Rect -> Line -> Maybe Line
_p1LeftTop_p2NotLeft r l | l.p2.y > r.ytop = Nothing
                         | otherwise       = let d = delta l in
                                             _p1LeftTop_p2NotLeftTop r l d (topProduct r l d) (leftProduct r l d)

-- P1 is in the left-top region, and P2 is not in any of the left or top regions
_p1LeftTop_p2NotLeftTop :: Rect -> Line -> Point -> Number -> Number -> Maybe Line
_p1LeftTop_p2NotLeftTop r l d topp leftp | topp > leftp = _p1LeftTop_p2NotLeftTop' r l d leftp
                                         | otherwise    = reflectLineXMinusY <$> _p1LeftTop_p2NotLeftTop' (reflectRectXMinusY r) (reflectLineXMinusY l) (reflectPointXMinusY d) topp

-- 1.1.1. "leftbottomregion"
-- P1 is in the left-top region, and P2 is not in any of the left or top regions, and above the vector from P1 to the left-top corner
_p1LeftTop_p2NotLeftTop' :: Rect -> Line -> Point -> Number -> Maybe Line
_p1LeftTop_p2NotLeftTop' r l d leftp | l.p2.y < r.ybottom = _p1LeftTop_p2Bottom r l d leftp (bottomProduct r l d)
                                     | otherwise          = Just { p1 : clipLeft r l d leftp
                                                                 , p2 : _p1LeftTop_p2Middle r l d leftp
                                                                 }

-- P1 is in the left-top region, and P2 is the centre-middle or right-middle region
_p1LeftTop_p2Middle :: Rect -> Line -> Point -> Number -> Point
_p1LeftTop_p2Middle r l d leftp | l.p2.x > r.xright = clipRight r l d (rightProduct r l d)
                                | otherwise         = l.p2

-- P1 is in the left-top region, and P2 is in the centre-bottom or right-bottom region
_p1LeftTop_p2Bottom :: Rect -> Line -> Point -> Number -> Number -> Maybe Line
_p1LeftTop_p2Bottom r l d leftp bottomp | bottomp > leftp = Nothing
                                        | otherwise       = Just { p1 : clipLeft r l d leftp
                                                                 , p2 : _p1LeftTop_p2Bottom' r l d bottomp
                                                                 }

_p1LeftTop_p2Bottom' :: Rect -> Line -> Point -> Number -> Point
_p1LeftTop_p2Bottom' r l d bottomp | l.p2.x > r.xright = _p1LeftTop_p2BottomRight r l d bottomp (rightProduct r l d)
                                   | otherwise         = clipBottom r l d bottomp

-- P1 is in the left-top region, and P2 is in the right-bottom region
_p1LeftTop_p2BottomRight :: Rect -> Line -> Point -> Number -> Number -> Point
_p1LeftTop_p2BottomRight r l d bottomp rightp | bottomp > rightp = clipBottom r l d bottomp
                                              | otherwise        = clipRight r l d rightp

-- 1.2. "leftedge"
-- P1 is in the left-middle region, and P2 is not in any of the left regions
_p1LeftMiddle_p2NotLeft :: Rect -> Line -> Maybe Line
_p1LeftMiddle_p2NotLeft r l | l.p2.y < r.ybottom = _p1LeftMiddle_p2BottomNotLeft r l
                            | l.p2.y > r.ytop    = reflectLineXAxis <$> _p1LeftMiddle_p2BottomNotLeft (reflectRectXAxis r) (reflectLineXAxis l)
                            | otherwise          = let d = delta l in
                                                   Just { p1 : clipLeft r l d (leftProduct r l d)
                                                        , p2 : _p1LeftMiddle_p2MiddleNotLeft r l d
                                                        }

-- P1 is in the left-middle region, and P2 is the centre-middle or right-middle region
_p1LeftMiddle_p2MiddleNotLeft :: Rect -> Line -> Point -> Point
_p1LeftMiddle_p2MiddleNotLeft r l d | l.p2.x > r.xright = clipRight r l d (rightProduct r l d)
                                    | otherwise         = l.p2

-- 1.2.1. "p2bottom"
-- P1 is in the left-middle region, and P2 is in the centre-bottom or right-bottom region
_p1LeftMiddle_p2BottomNotLeft :: Rect -> Line -> Maybe Line
_p1LeftMiddle_p2BottomNotLeft r l = let d = delta l in
                                    _p1LeftMiddle_p2BottomNotLeft' r l d (leftProduct r l d) (bottomProduct r l d)

_p1LeftMiddle_p2BottomNotLeft' :: Rect -> Line -> Point -> Number -> Number -> Maybe Line
_p1LeftMiddle_p2BottomNotLeft' r l d leftp bottomp | bottomp > leftp = Nothing
                                                   | otherwise       = Just { p1 : clipLeft r l d leftp
                                                                            , p2 : _p1LeftMiddle_p2BottomNotLeft'' r l d bottomp
                                                                            }

_p1LeftMiddle_p2BottomNotLeft'' :: Rect -> Line -> Point -> Number -> Point
_p1LeftMiddle_p2BottomNotLeft'' r l d bottomp | l.p2.x > r.xright = _p1LeftMiddle_p2RightBottom r l d bottomp (rightProduct r l d)
                                              | otherwise         = clipBottom r l d bottomp

-- P2 is beyond the right boundary
_p1LeftMiddle_p2RightBottom :: Rect -> Line -> Point -> Number -> Number -> Point
_p1LeftMiddle_p2RightBottom r l d bottomp rightp | bottomp > rightp = clipBottom r l d bottomp
                                                 | otherwise        = clipRight r l d rightp

-- 2. "centrecolumn"
-- P1 is in one of the centre regions
_p1Centre :: Rect -> Line -> Maybe Line
_p1Centre r l | l.p1.y < r.ybottom = _p1CentreBottom r l
              | l.p1.y > r.ytop    = _p1CentreTop r l
              | otherwise          = Just { p1 : l.p1
                                          , p2 : _p1CentreMiddle r l
                                          }

-- P1 is in the centre-bottom region
_p1CentreBottom :: Rect -> Line -> Maybe Line
_p1CentreBottom r l | l.p2.y < r.ybottom = Nothing
                    | otherwise          = rotateLine270c <$> _p1LeftMiddle_p2NotLeft (rotateRect90c r) (rotateLine90c l)

-- P1 is in the centre-top region
_p1CentreTop :: Rect -> Line -> Maybe Line
_p1CentreTop r l | l.p2.y > r.ytop = Nothing
                 | otherwise       = rotateLine90c <$> _p1LeftMiddle_p2NotLeft (rotateRect270c r) (rotateLine270c l)


-- 2.1. "inside"
-- P1 is in the centre-middle region
_p1CentreMiddle :: Rect -> Line -> Point
_p1CentreMiddle r l | l.p2.x < r.xleft   = _p1CentreMiddle_p2Left r l
                    | l.p2.x > r.xright  = rotatePoint180c $ _p1CentreMiddle_p2Left (rotateRect180c r) (rotateLine180c l)
                    | l.p2.y > r.ytop    = let d = delta l in
                                           clipTop r l d (topProduct r l d)
                    | l.p2.y < r.ybottom = let d = delta l in
                                           clipBottom r l d (bottomProduct r l d)
                    | otherwise          = l.p2

-- P1 is in the centre-middle region, and P2 is in one of the left regions
_p1CentreMiddle_p2Left :: Rect -> Line -> Point
_p1CentreMiddle_p2Left r l | l.p2.y > r.ytop    = _p1CentreMiddle_p2LeftTop r l
                           | l.p2.y < r.ybottom = rotatePoint270c $ _p1CentreMiddle_p2LeftTop (rotateRect90c r) (rotateLine90c l)
                           | otherwise          = let d = delta l in
                                                  clipLeft r l d (leftProduct r l d)

-- P1 is in the centre-middle region, and P2 is in the left-top region
_p1CentreMiddle_p2LeftTop :: Rect -> Line -> Point
_p1CentreMiddle_p2LeftTop r l = let d = delta l in
                                _p1CentreMiddle_p2LeftTop' r l d (leftProduct r l d) (topProduct r l d)

_p1CentreMiddle_p2LeftTop' :: Rect -> Line -> Point -> Number -> Number -> Point
_p1CentreMiddle_p2LeftTop' r l d leftp topp | topp > leftp = clipTop r l d topp
                                            | otherwise    = clipLeft r l d leftp
