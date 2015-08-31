module Vector where

import Math


type Vector = { x :: Number
              , y :: Number
              }


add :: Vector -> Vector -> Vector
add a b = { x : a.x + b.x
          , y : a.y + b.y
          }

sub :: Vector -> Vector -> Vector
sub a b = { x : a.x - b.x
          , y : a.y - b.y
          }

dot :: Vector -> Vector -> Number
dot a b = a.x * b.x + a.y * b.y

perp :: Vector -> Vector -> Number
perp a b = a.x * b.y - a.y * b.x

mul :: Number -> Vector -> Vector
mul n a = { x : n * a.x
          , y : n * a.y
          }

mul' :: Vector -> Number -> Vector
mul' a n = { x : a.x * n
           , y : a.y * n
           }

len :: Vector -> Number
len a = sqrt (a.x * a.x + a.y * a.y)

proj :: Vector -> Vector -> Number
proj a b = (a `dot` b) / len b

dist :: Vector -> Vector -> Number
dist a b = len (a `sub` b)

bound :: Vector -> Number -> { p :: Vector, q :: Vector }
bound v n = { p : { x : v.x - n
                  , y : v.y - n
                  }
            , q : { x : v.x + n
                  , y : v.y + n
                  }
            }
