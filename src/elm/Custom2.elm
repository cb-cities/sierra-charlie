module Custom where

import Random
import Time exposing (Time)


type alias Point =
  { x : Float
  , y : Float
  }

type alias Area =
  { center : Point
  , radius : Float
  }


type alias TOID =
    String

type alias RoadNode =
  { toid  : TOID
  , point : Point
  }

type LinkDirection =
    Both
  | StartToEnd
  | EndToStart

type alias RoadLink =
  { toid      : TOID
  , startNode : RoadNode
  , endNode   : RoadNode
  , direction : LinkDirection
  , points    : List Point
  }

type alias Geometry =
  { roadNodes   : List RoadNode
  , roadLinks   : List RoadLink
  }


type alias Label =
  { link  : RoadLink
  , value : Float
  }

type alias LabelingPhase =
  { startTime : Time
  , endTime   : Time
  , labels    : List Label
  }

type alias AnyLabeling =
  { phases : List LabelingPhase
  }


type alias ValuePhase =
  { startTime : Time
  , endTime   : Time
  , value     : Float
  }

type alias PhasedLabel =
  { link   : RoadLink
  , phases : List ValuePhase
  }


type alias RoutingPhase =
  { startTime  : Time
  , endTime    : Time
  , quota      : Int
  , startAreas : List Area
  , endAreas   : List Area
  }


type ForeignRoutingService =
    Google

type alias ImportSetup =
  { service  : ForeignRoutingService
  , apiKey   : String
  , geometry : Geometry
  , phases   : List RoutingPhase
  }

type TravelMode =
    Driving
  | Transit
  | Walking

type alias ForeignRouteStep =
  { duration : Time
  , points   : List Point
  , mode     : TravelMode
  }

type alias ForeignRoute =
  { startTime  : Time
  , endTime    : Time
  , startPoint : Point
  , endPoint   : Point
  , steps      : List ForeignRouteStep
  }

type alias RouteStep =
  { duration  : Time
  , link      : RoadLink
  , mode      : TravelMode
  }

type alias Route =
  { startTime : Time
  , endTime   : Time
  , startNode : RoadNode
  , endNode   : RoadNode
  , steps     : List RouteStep
  }

type alias ImportedLabeling =
  { setup         : ImportSetup
  , foreignRoutes : List ForeignRoute
  , routes        : List Route
  , phases        : List LabelingPhase
  }


type Adjustment =
    InsertNode RoadNode
  | InsertLink RoadLink
  | DeleteNode RoadNode
  | DeleteLink RoadLink
  | UpdateLabel PhasedLabel

type alias SimulationSetup =
  { randomSeed  : Random.Seed
  , geometry    : Geometry
  , labeling    : AnyLabeling
  , adjustments : List Adjustment
  , phases      : List RoutingPhase
  }

type alias SimulatedLabeling =
  { setup  : SimulationSetup
  , routes : List Route
  , phases : List LabelingPhase
  }


-- Add function for coming up with missing labels

-- Add function for converting from labels to agent counts
-- and inverse function
