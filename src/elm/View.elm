module View where

import Html exposing (Html, a, div, span, text)
import Html.Attributes exposing (class, id, style)
import Html.Events exposing (onMouseEnter, onMouseLeave, onClick)
import Html.Lazy exposing (lazy, lazy2)

import Types exposing (..)


type alias Trigger =
    Signal.Address Action


view : Trigger -> State -> Html
view trigger state =
    div []
      [ div []
          [ lazy viewLoadingProgress state.loadingProgress
          , lazy2 (viewFeature trigger "highlighted") state.mode state.highlightedFeature
          , lazy2 (viewFeature trigger "selected") state.mode state.selectedFeature
          ]
      , div [id "ui-windows-top-left"]
          []
      , div [id "ui-windows-top-right"]
          [ lazy (viewAdjustmentWindow trigger) state.adjustment
          , lazy (viewRoutesWindow trigger) state.routes
          ]
      ]


viewLoadingProgress : Float -> Html
viewLoadingProgress loadingProgress =
    let
      opacity =
        if loadingProgress == 100
          then [style [("opacity", "0")]]
          else []
    in
      div ([id "ui-loading-progress-track"] ++ opacity)
        [ div
            [ id "ui-loading-progress-bar"
            , style [("width", toString loadingProgress ++ "%")]
            ]
            []
        ]


viewFeature : Trigger -> String -> Maybe Mode -> Maybe Feature -> Html
viewFeature trigger featureKind maybeMode maybeFeature =
    let
      featureId =
        if featureKind == "highlighted"
          then "ui-highlighted-feature"
          else "ui-selected-feature"
      titlePrefix =
        if featureKind == "highlighted"
          then "Highlighted"
          else "Selected"
      display =
        if maybeFeature == Nothing
          then [style [("display", "none")]]
          else []
      contents =
        case maybeFeature of
          Nothing ->
            []
          Just feature ->
            case (feature.tag, feature.roadNode, feature.roadLink, feature.road, feature.route) of
              ("roadNode", Just roadNode, Nothing, Nothing, Nothing) ->
                viewRoadNode trigger maybeMode titlePrefix roadNode
              ("roadLink", Nothing, Just roadLink, Nothing, Nothing) ->
                viewRoadLink trigger titlePrefix roadLink
              ("road", Nothing, Nothing, Just road, Nothing) ->
                viewRoad trigger titlePrefix road
              ("route", Nothing, Nothing, Nothing, Just route) ->
                viewRoute trigger titlePrefix route
              _ ->
                []
    in
      div ([id featureId, class "ui-window"] ++ display) contents


viewRoadNode : Trigger -> Maybe Mode -> String -> RoadNode -> List Html
viewRoadNode trigger maybeMode titlePrefix roadNode =
    let
      title =
        [viewWindowTitle (titlePrefix ++ " Road Node")]
      description =
        case roadNode.address of
          Nothing ->
            []
          Just address ->
            [div [] [text address]]
      actions =
        case (roadNode.isDeleted, roadNode.isUndeletable) of
          (False, _) ->
            ( viewButtons trigger
                [ case maybeMode of
                    Just GetRoute ->
                      viewActiveButton (Send (SetMode Nothing)) "Get Route…"
                    _ ->
                      viewButton (Send (SetMode (Just GetRoute))) "Get Route…"
                , viewButton (Send DeleteSelectedFeature) "Delete"
                ] ++
              viewButtons trigger
                [ case maybeMode of
                    Just AskGoogleForRoute ->
                      viewActiveButton (Send (SetMode Nothing)) "Ask Google For Route…"
                    _ ->
                      viewButton (Send (SetMode (Just AskGoogleForRoute))) "Ask Google For Route…"
                ]
            )
          (True, True) ->
            viewButtons trigger
              [ viewButton (Send UndeleteSelectedFeature) "Undelete"
              ]
          _ ->
            []
      toid =
        viewLabeled "TOID" [viewTOID trigger roadNode.toid]
      roadLinks =
        viewLabeledList "Road Links" (viewTOIDItem trigger) roadNode.roadLinkTOIDs
    in
      title ++ description ++ actions ++ toid ++ roadLinks


viewRoadLink : Trigger -> String -> RoadLink -> List Html
viewRoadLink trigger titlePrefix roadLink =
    let
      title =
        [viewWindowTitle (titlePrefix ++ " Road Link")]
      description =
        [div [] [viewRoadLinkDescription roadLink]]
      actions =
        case (roadLink.isDeleted, roadLink.isUndeletable) of
          (False, _) ->
            viewButtons trigger
              [ viewButton (Send DeleteSelectedFeature) "Delete"
              ]
          (True, True) ->
            viewButtons trigger
              [ viewButton (Send UndeleteSelectedFeature) "Undelete"
              ]
          _ ->
            []
      toid =
        viewLabeled "TOID" [viewTOID trigger roadLink.toid]
      roadNodes =
        case (roadLink.negativeNodeTOID, roadLink.positiveNodeTOID) of
          (Nothing, Nothing) ->
            []
          (Just negativeNodeTOID, Nothing) ->
            viewLabeled "Road Nodes"
              [ viewItem (span [] [text "− ", viewTOID trigger negativeNodeTOID])
              ]
          (Nothing, Just positiveNodeTOID) ->
            viewLabeled "Road Nodes"
              [ viewItem (span [] [text "+ ", viewTOID trigger positiveNodeTOID])
              ]
          (Just negativeNodeTOID, Just positiveNodeTOID) ->
            viewLabeled "Road Nodes"
              [ viewItem (span [] [text "− ", viewTOID trigger negativeNodeTOID])
              , viewItem (span [] [text "+ ", viewTOID trigger positiveNodeTOID])
              ]
      roads =
        viewLabeledList "Roads" (viewRoadItem trigger) roadLink.roads
    in
      title ++ description ++ actions ++ toid ++ roadNodes ++ roads


viewRoadLinkDescription : RoadLink -> Html
viewRoadLinkDescription roadLink =
    text (roadLink.term ++ ", " ++ roadLink.nature)


viewRoadItem : Trigger -> Road -> Html
viewRoadItem trigger road =
    let
      toid =
        [viewTOIDItem trigger road.toid]
      description =
        [viewItem (viewRoadDescription road)]
    in
      div [] (toid ++ description)


viewRoad : Trigger -> String -> Road -> List Html
viewRoad trigger titlePrefix road =
    let
      title =
        [viewWindowTitle (titlePrefix ++ " Road")]
      description =
        [div [] [viewRoadDescription road]]
      actions =
        case road.isDeleted of
          False ->
            viewButtons trigger
              [ viewButton (Send DeleteSelectedFeature) "Delete"
              ]
          True ->
            viewButtons trigger
              [ viewButton (Send UndeleteSelectedFeature) "Undelete"
              ]
      toid =
        viewLabeled "TOID" [viewTOID trigger road.toid]
      roadLinks =
        viewLabeledList "Road Links" (viewTOIDItem trigger) road.roadLinkTOIDs
    in
      title ++ description ++ actions ++ toid ++ roadLinks


viewRoute : Trigger -> String -> Route -> List Html
viewRoute trigger titlePrefix route =
    let
      title =
        [viewWindowTitle (titlePrefix ++ " Route")]
      actions =
        viewButtons trigger
          [ viewButton (Send DeleteSelectedFeature) "Delete"
          ]
      toid =
        viewLabeled "TOID" [viewTOID trigger route.toid]
      roadNodes =
        viewLabeled "Road Nodes"
          [ viewItem (span [] [text "< ", viewTOID trigger route.startNodeTOID])
          , viewItem (span [] [text "> ", viewTOID trigger route.endNodeTOID])
          ]
      roadLinks =
        viewLabeledList "Road Links" (viewTOIDItem trigger) route.roadLinkTOIDs
    in
      title ++ actions ++ toid ++ roadNodes ++ roadLinks


viewRoadDescription : Road -> Html
viewRoadDescription road =
    case road.term of
      Nothing ->
        text (road.name ++ ", " ++ road.group)
      Just term ->
        text (road.name ++ ", " ++ road.group ++ ", " ++ term)


viewRoutesWindow : Trigger -> List Route -> Html
viewRoutesWindow trigger routes =
    let
      display =
        if routes == []
          then [style [("display", "none")]]
          else []
      contents =
        if routes == []
          then []
          else
            let
              validRoutes =
                case List.filter (\route -> route.roadLinkTOIDs /= []) routes of
                  [] ->
                    []
                  validList ->
                    viewRoutes trigger "Valid Routes" validList
              invalidRoutes =
                case List.filter (\route -> route.roadLinkTOIDs == []) routes of
                  [] ->
                    []
                  invalidList ->
                    viewRoutes trigger "Invalid Routes" invalidList
            in
              [viewWindowTitle "Routes"] ++
              viewButtons trigger
                [ viewButton (Send ClearRoutes) "Clear"
                , viewButton (SendSpecial SaveRoutesAsJSON) "Save As JSON"
                ] ++
              validRoutes ++
              invalidRoutes
    in
      div ([class "ui-window"] ++ display) contents


viewRoutes : Trigger -> String -> List Route -> List Html
viewRoutes trigger label routes =
    viewLabeledList label (viewTOIDItem trigger) (List.map .toid routes)


viewAdjustmentWindow : Trigger -> Maybe Adjustment -> Html
viewAdjustmentWindow trigger maybeAdjustment =
    let
      isEmpty =
        case maybeAdjustment of
          Nothing ->
            True
          Just adjustment ->
            if adjustment.deletedItemCount == 0
              then True
              else False
      display =
        if isEmpty
          then [style [("display", "none")]]
          else []
      contents =
        case maybeAdjustment of
          Nothing ->
            []
          Just adjustment ->
            [viewWindowTitle "Adjustment"] ++
            viewButtons trigger
              [ viewButton (Send ClearAdjustment) "Clear"
              , viewButton (SendSpecial SaveAdjustmentAsJSON) "Save As JSON"
              ] ++
            [ div []
                ( viewLabeledList "Deleted Nodes" (viewTOIDItem trigger) adjustment.deletedRoadNodeTOIDs ++
                  viewLabeledList "Deleted Links" (viewTOIDItem trigger) adjustment.deletedRoadLinkTOIDs ++
                  viewLabeledList "Deleted Roads" (viewTOIDItem trigger) adjustment.deletedRoadTOIDs
                )
            ]
    in
      div ([class "ui-window"] ++ display) contents


viewWindowTitle : String -> Html
viewWindowTitle title =
    div [class "ui-window-title"] [text title]


viewTOIDItem : Trigger -> String -> Html
viewTOIDItem trigger toid =
    viewItem (viewTOID trigger toid)


viewTOID : Trigger -> String -> Html
viewTOID trigger toid =
    a
      [ onClick trigger (Send (SelectFeatureByTOID (Just toid)))
      , onMouseEnter trigger (Send (HighlightFeatureByTOID (Just toid)))
      , onMouseLeave trigger (Send (HighlightFeatureByTOID Nothing))
      ]
      [text toid]


viewItem : Html -> Html
viewItem item =
    div [] [item]


viewLabeledList : String -> (a -> Html) -> List a -> List Html
viewLabeledList label view items =
    case items of
      [] ->
        []
      _ ->
        viewLabeled label (List.map view items)


viewLabeled : String -> List Html -> List Html
viewLabeled label contents =
    [div [] ([viewLabel label] ++ contents)]


viewLabel : String -> Html
viewLabel label =
    div [class "ui-label"] [text label]


viewButtons : Trigger -> List (Trigger -> Html) -> List Html
viewButtons trigger buttons =
    [div [class "ui-actions"] (List.map (\button -> button trigger) buttons)]


viewButton : Action -> String -> Trigger -> Html
viewButton action label trigger =
    span [] [a [onClick trigger action] [text label]]


viewActiveButton : Action -> String -> Trigger -> Html
viewActiveButton action label trigger =
    span [] [a [onClick trigger action, class "ui-active"] [text label]]
