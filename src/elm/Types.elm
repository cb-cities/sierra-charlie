module Types where

import Signal


type alias RoadNode =
  { toid : String
  , address : Maybe String
  , roadLinkTOIDs : List String
  , isDeleted : Bool
  }


type alias RoadLink =
  { toid : String
  , term : String
  , nature : String
  , negativeNodeTOID : Maybe String
  , positiveNodeTOID : Maybe String
  , roads : List Road
  , isDeleted : Bool
  }


type alias Road =
  { toid : String
  , group : String
  , term : Maybe String
  , name : String
  , roadLinkTOIDs : List String
  }


type alias Route =
  { startNodeTOID : String
  , endNodeTOID : String
  , roadLinkTOIDs : List String
  }


type alias Feature =
  { tag : String
  , roadNode : Maybe RoadNode
  , roadLink : Maybe RoadLink
  , road : Maybe Road
  , route : Maybe Route
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
  | DeleteSelectedFeature
  | UndeleteSelectedFeature


type alias Trigger =
    Signal.Address Action
