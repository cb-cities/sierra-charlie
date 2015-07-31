{-

T.M. Nicholl, D.T. Lee, R.A. Nicholl, “An efficient new algorithm for 2D line clipping: Its development and analysis”, Computer Graphics, volume 21, number 4, July 1987

 left top      | centre top    | right top
---------------+---------------+---------------
 left middle   | centre middle | right middle
---------------+---------------+---------------
 left bottom   | center bottom | right bottom

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


-- TODO
delta :: Line -> Point
delta l = { x : l.p2.x - l.p1.x
          , y : l.p2.y - l.p1.y
          }

-- TODO
leftProduct :: Rect -> Line -> Point -> Number
leftProduct r l d = (r.xleft - l.p1.x) * d.y

-- TODO
topProduct :: Rect -> Line -> Point -> Number
topProduct r l d = (r.ytop - l.p1.y) * d.x

-- TODO
rightProduct :: Rect -> Line -> Point -> Number
rightProduct r l d = (r.xright - l.p1.x) * d.y

-- TODO
bottomProduct :: Rect -> Line -> Point -> Number
bottomProduct r l d = (r.ybottom - l.p1.y) * d.x


-- TODO
clipAll :: Rect -> Array Line -> Array Line
clipAll r ls = catMaybes $ map (clip r) ls

-- Clip line l to rect r
clip :: Rect -> Line -> Maybe Line
clip r l | l.p1.x < r.xleft  = clipP1Left r l
         | l.p1.x > r.xright = rotateLine180c <$> clipP1Left (rotateRect180c r) (rotateLine180c l)
         | otherwise         = clipP1Centre r l

-- 1. "leftcolumn"
-- P1 is beyond the left boundary
clipP1Left :: Rect -> Line -> Maybe Line
clipP1Left r l | l.p2.x < r.xleft   = Nothing
               | l.p1.y > r.ytop    = clipP1LeftTop r l
               | l.p1.y < r.ybottom = reflectLineXAxis <$> clipP1LeftTop (reflectRectXAxis r) (reflectLineXAxis l)
               | otherwise          = clipP1LeftMiddle r l

-- 1.1. "topleftcorner"
-- P1 is in the left-top corner
-- P2 is not beyond the left boundary
clipP1LeftTop :: Rect -> Line -> Maybe Line
clipP1LeftTop r l | l.p2.y > r.ytop = Nothing
                  | otherwise       = let d = delta l in
                                      clipP1LeftTop' r l d (topProduct r l d) (leftProduct r l d)

-- P1 is in the left-top corner
-- P2 is not beyond the left or top boundaries
clipP1LeftTop' :: Rect -> Line -> Point -> Number -> Number -> Maybe Line
clipP1LeftTop' r l d ptop pleft | ptop > pleft = leftBottomRegion r l d pleft
                                | otherwise    = reflectLineXMinusY <$> leftBottomRegion (reflectRectXMinusY r) (reflectLineXMinusY l) (reflectPointXMinusY d) ptop

-- 1.1.1. "leftbottomregion"
-- P1 is in the left-top corner
-- P2 is not beyond the left or top boundaries
-- P2 is to the right of the vector from P1 to the left-top corner
leftBottomRegion :: Rect -> Line -> Point -> Number -> Maybe Line
leftBottomRegion r l d pleft | l.p2.y < r.ybottom = lbrP2Bottom r l d pleft (bottomProduct r l d)
                             | otherwise          = let p2 = lbrP2Inside r l d pleft in
                                                    Just { p1 : { x : r.xleft
                                                                , y : l.p1.y + pleft / d.x
                                                                }
                                                         , p2 : p2
                                                         }

-- P2 is above the bottom boundary
lbrP2Inside :: Rect -> Line -> Point -> Number -> Point
lbrP2Inside r l d pleft | l.p2.x > r.xright = let pright = rightProduct r l d in
                                              { x : r.xright
                                              , y : l.p1.y + pright / d.x
                                              }
                        | otherwise         = l.p2

-- P2 is below the bottom boundary
lbrP2Bottom :: Rect -> Line -> Point -> Number -> Number -> Maybe Line
lbrP2Bottom r l d pleft pbottom | pbottom > pleft = Nothing
                                | otherwise       = let p2 = lbrP2Bottom' r l d pbottom in
                                                    Just { p1 : { x : r.xleft
                                                                , y : l.p1.y + pleft / d.x
                                                                }
                                                         , p2 : p2
                                                         }

lbrP2Bottom' :: Rect -> Line -> Point -> Number -> Point
lbrP2Bottom' r l d pbottom | l.p2.x > r.xright = lbrP2BottomRight r l d pbottom (rightProduct r l d)
                           | otherwise         = { x : l.p1.x + pbottom / d.y
                                                 , y : r.ybottom
                                                 }

-- P2 is to the right of the right boundary
lbrP2BottomRight :: Rect -> Line -> Point -> Number -> Number -> Point
lbrP2BottomRight r l d pbottom pright | pbottom > pright = { x : l.p1.x + pbottom / d.y
                                                           , y : r.ybottom
                                                           }
                                      | otherwise        = { x : r.xright
                                                           , y : l.p1.y + pright / d.x
                                                           }

-- 1.2. "leftedge"
-- P1 is in the left middle region
-- P2 is not beyond the left boundary
clipP1LeftMiddle :: Rect -> Line -> Maybe Line
clipP1LeftMiddle r l | l.p2.y < r.ybottom = clipP1LeftMiddleP2Bottom r l
                     | l.p2.y > r.ytop    = reflectLineXAxis <$> clipP1LeftMiddleP2Bottom (reflectRectXAxis r) (reflectLineXAxis l)
                     | otherwise          = let d     = delta l
                                                pleft = leftProduct r l d
                                                p2    = clipP1LeftMiddleP2Middle r l d in
                                            Just { p1 : { x : r.xleft
                                                        , y : l.p1.y + pleft / d.x
                                                        }
                                                 , p2 : p2
                                                 }

-- P1 is in the left middle region
-- P2 is not beyond the left boundary
-- P2 is between the top and the bottom boundaries
clipP1LeftMiddleP2Middle :: Rect -> Line -> Point -> Point
clipP1LeftMiddleP2Middle r l d | l.p2.x > r.xright = let pright = rightProduct r l d in
                                                     { x : r.xright
                                                     , y : l.p1.y + pright / d.x
                                                     }
                               | otherwise         = l.p2

-- 1.2.1. P1 is in the left edge region, P2 is not beyond the left boundary, and P2 is beyond the bottom boundary
clipP1LeftMiddleP2Bottom :: Rect -> Line -> Maybe Line
clipP1LeftMiddleP2Bottom r l = let d = delta l in
                               clipP1LeftMiddleP2Bottom' r l d (leftProduct r l d) (bottomProduct r l d)

clipP1LeftMiddleP2Bottom' :: Rect -> Line -> Point -> Number -> Number -> Maybe Line
clipP1LeftMiddleP2Bottom' r l d pleft pbottom | pbottom > pleft = Nothing
                                              | otherwise       = let p2 = clipP1LeftMiddleP2Bottom'' r l d pbottom in
                                                                  Just { p1 : { x : r.xleft
                                                                              , y : l.p1.y + pleft / d.x
                                                                              }
                                                                       , p2 : p2
                                                                       }

clipP1LeftMiddleP2Bottom'' :: Rect -> Line -> Point -> Number -> Point
clipP1LeftMiddleP2Bottom'' r l d pbottom | l.p2.x > r.xright = clipP1LeftMiddleP2RightBottom r l d pbottom (rightProduct r l d)
                                         | otherwise         = { x : l.p1.x + pbottom / d.y
                                                               , y : r.ybottom
                                                               }

-- P2 is to the right of the right boundary
clipP1LeftMiddleP2RightBottom :: Rect -> Line -> Point -> Number -> Number -> Point
clipP1LeftMiddleP2RightBottom r l d pbottom pright | pbottom > pright = { x : l.p1.x + pbottom / d.y
                                                                        , y : r.ybottom
                                                                        }
                                                   | otherwise        = { x : r.xright
                                                                        , y : l.p1.y + pright / d.x
                                                                        }

-- 2. "centrecolumn"
-- P1 is between the left and right boundaries
clipP1Centre :: Rect -> Line -> Maybe Line
clipP1Centre r l | l.p1.y < r.ybottom = clipP1CentreBottom r l
                 | l.p1.y > r.ytop    = clipP1CentreTop r l
                 | otherwise          = let p2 = clipP1CentreMiddle r l in
                                        Just { p1 : { x : l.p1.x
                                                    , y : l.p1.y
                                                    }
                                             , p2 : p2
                                             }

-- P1 is between the left and right boundaries, and below the bottom boundary
clipP1CentreBottom :: Rect -> Line -> Maybe Line
clipP1CentreBottom r l | l.p2.y < r.ybottom = Nothing
                       | otherwise          = rotateLine270c <$> clipP1LeftMiddle (rotateRect90c r) (rotateLine90c l)

-- P1 is between the left and right boundaries, and above the top boundary
clipP1CentreTop :: Rect -> Line -> Maybe Line
clipP1CentreTop r l | l.p2.y > r.ytop = Nothing
                    | otherwise       = rotateLine90c <$> clipP1LeftMiddle (rotateRect270c r) (rotateLine270c l)


-- 2.1. "inside"
-- P1 is between the left and right boundaries, and between the top and bottom boundaries
clipP1CentreMiddle :: Rect -> Line -> Point
clipP1CentreMiddle r l | l.p2.x < r.xleft   = clipP1CentreMiddleP2Left r l
                       | l.p2.x > r.xright  = rotatePoint180c $ clipP1CentreMiddleP2Left (rotateRect180c r) (rotateLine180c l)
                       | l.p2.y > r.ytop    = let d    = delta l
                                                  ptop = topProduct r l d in
                                              { x : l.p1.x + ptop / d.y
                                              , y : r.ytop
                                              }
                       | l.p2.y < r.ybottom = let d       = delta l
                                                  pbottom = bottomProduct r l d in
                                              { x : l.p1.x + pbottom / d.y
                                              , y : r.ybottom
                                              }
                       | otherwise          = { x : l.p2.x
                                              , y : l.p2.y
                                              }

-- P1 is between the left and right boundaries, and between the top and bottom boundaries
-- P2 is beyond the left boundary
clipP1CentreMiddleP2Left :: Rect -> Line -> Point
clipP1CentreMiddleP2Left r l | l.p2.y > r.ytop    = clipP1CentreMiddleP2LeftTop r l
                             | l.p2.y < r.ybottom = rotatePoint270c $ clipP1CentreMiddleP2LeftTop (rotateRect90c r) (rotateLine90c l)
                             | otherwise          = let d     = delta l
                                                        pleft = leftProduct r l d in
                                                    { x : r.xleft
                                                    , y : l.p1.y + pleft / d.x
                                                    }

-- P1 is between the left and right boundaries, and between the top and bottom boundaries
-- P2 is above the top boundary
clipP1CentreMiddleP2LeftTop :: Rect -> Line -> Point
clipP1CentreMiddleP2LeftTop r l = let d = delta l in
                                  clipP1CentreMiddleP2LeftTop' r l d (leftProduct r l d) (topProduct r l d)

clipP1CentreMiddleP2LeftTop' :: Rect -> Line -> Point -> Number -> Number -> Point
clipP1CentreMiddleP2LeftTop' r l d pleft ptop | ptop > pleft = { x : l.p1.x + ptop / d.y
                                                               , y : r.ytop
                                                               }
                                              | otherwise    = { x : r.xleft
                                                               , y : l.p1.y + pleft / d.x
                                                               }
