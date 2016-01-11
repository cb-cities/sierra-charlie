module Types where

import Signal


type alias RoadNode =
  { toid : String
  , address : Maybe String
  , roadLinks : List String
  }


type alias RoadLink =
  { toid : String
  , term : String
  , nature : String
  , negativeNode : Maybe String
  , positiveNode : Maybe String
  , roads : List Road
  }


type alias Road =
  { toid : String
  , group : String
  , term : Maybe String
  , name : String
  , roadLinks : List String
  }


type alias Feature =
  { tag : String
  , roadNode : Maybe RoadNode
  , roadLink : Maybe RoadLink
  , road : Maybe Road
  }


type alias State =
  { mode : Maybe String
  , loadingProgress : Float
  , highlightedFeature : Maybe Feature
  , selectedFeature : Maybe Feature
  }


type Action =
    Idle
  | ReceiveMode (Maybe String)
  | ReceiveLoadingProgress Float
  | ReceiveHighlightedFeature (Maybe Feature)
  | ReceiveSelectedFeature (Maybe Feature)
  | SetMode (Maybe String)
  | HighlightFeature (Maybe String)
  | SelectFeature (Maybe String)


type alias Trigger =
    Signal.Address Action
