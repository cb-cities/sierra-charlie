module Types where


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
  | Receive IncomingMessage
  | Send OutgoingMessage
  | SendSpecial SpecialOutgoingMessage


type IncomingMessage =
    UpdateMode (Maybe String)
  | UpdateLoadingProgress Float
  | UpdateHighlightedFeature (Maybe Feature)
  | UpdateSelectedFeature (Maybe Feature)
  | UpdateRoutes (List Route)
  | UpdateAdjustment (Maybe Adjustment)


type OutgoingMessage =
    SetMode (Maybe String)
  | HighlightFeatureByTOID (Maybe String)
  | SelectFeatureByTOID (Maybe String)
  | DeleteSelectedFeature
  | UndeleteSelectedFeature
  | ClearRoutes
  | ClearAdjustment


type SpecialOutgoingMessage =
    ExportRoutes
  | ExportAdjustment


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
