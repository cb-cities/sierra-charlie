module Types where

import Signal


type alias RoadNode =
  { toid : String
  , address : Maybe String
  , roadLinkTOIDs : List String
  , isDeleted : Bool
  , isUndeletable : Bool
  }


type alias RoadLink =
  { toid : String
  , term : String
  , nature : String
  , negativeNodeTOID : Maybe String
  , positiveNodeTOID : Maybe String
  , roads : List Road
  , isDeleted : Bool
  , isUndeletable : Bool
  }


type alias Road =
  { toid : String
  , group : String
  , term : Maybe String
  , name : String
  , roadLinkTOIDs : List String
  , isDeleted : Bool
  }


type alias Route =
  { toid : String
  , startNodeTOID : String
  , endNodeTOID : String
  , roadLinkTOIDs : List String
  , isValid : Bool
  }


type alias Feature =
  { tag : String
  , roadNode : Maybe RoadNode
  , roadLink : Maybe RoadLink
  , road : Maybe Road
  , route : Maybe Route
  }


type alias Adjustment =
  { deletedItemCount : Int
  , deletedRoadNodeTOIDs : List String
  , deletedRoadLinkTOIDs : List String
  , deletedRoadTOIDs : List String
  }


type alias State =
  { mode : Maybe String
  , loadingProgress : Float
  , highlightedFeature : Maybe Feature
  , selectedFeature : Maybe Feature
  , routes : List Route
  , adjustment : Maybe Adjustment
  }


type Action =
    Idle
  | ReceiveMode (Maybe String)
  | ReceiveLoadingProgress Float
  | ReceiveHighlightedFeature (Maybe Feature)
  | ReceiveSelectedFeature (Maybe Feature)
  | ReceiveRoutes (List Route)
  | ReceiveAdjustment (Maybe Adjustment)
  | SetMode (Maybe String)
  | HighlightFeature (Maybe String)
  | SelectFeature (Maybe String)
  | DeleteSelectedFeature
  | UndeleteSelectedFeature
  | ClearRoutes
  | ClearAdjustment


type alias Trigger =
    Signal.Address Action
