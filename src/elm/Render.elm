module Render where

import Html exposing (Html, a, code, div, hr, pre, text)
import Html.Attributes exposing (class, id, style)
import Html.Events exposing (onClick, onMouseEnter, onMouseLeave)
import Html.Lazy exposing (lazy, lazy2, lazy3)
import List.Extra as List

import Html.MoreEvents exposing (..)
import Types exposing (..)


type alias Trigger =
    Signal.Address Action


renderUI : Trigger -> State -> Html
renderUI trigger state =
    div []
      [ div []
          [ lazy renderLoadingProgress state.loadingProgress
          ]
      , div [id "ui-top-left"]
          [ lazy3 (renderViewsWindow trigger) state.viewGroups state.activeViews state.viewInfoVisible
          , lazy2 (renderViewInfoWindow trigger) state.activeViews state.viewInfoVisible
          ]
      , div [id "ui-top-right"]
          [ lazy3 (renderModelsWindow trigger) state.modelGroups state.activeModel state.modelInfoVisible
          , lazy2 (renderModelInfoWindow trigger) state.activeModel state.modelInfoVisible
          , lazy (renderAdjustmentWindow trigger) state.adjustment
          ]
      , div [id "ui-bottom-left"]
          [ lazy2 (renderFeature trigger "highlighted") state.mode state.highlightedFeature
          ]
      , div [id "ui-bottom-right"]
          [ lazy2 (renderFeature trigger "selected") state.mode state.selectedFeature
          , lazy (renderRoutesWindow trigger) state.routes
          ]
      ]


renderLoadingProgress : Float -> Html
renderLoadingProgress loadingProgress =
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


renderFeature : Trigger -> String -> Maybe Mode -> Maybe Feature -> Html
renderFeature trigger featureKind maybeMode maybeFeature =
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
                renderRoadNode trigger maybeMode titlePrefix roadNode
              ("roadLink", Nothing, Just roadLink, Nothing, Nothing) ->
                renderRoadLink trigger titlePrefix roadLink
              ("road", Nothing, Nothing, Just road, Nothing) ->
                renderRoad trigger titlePrefix road
              ("route", Nothing, Nothing, Nothing, Just route) ->
                renderRoute trigger titlePrefix route
              _ ->
                []
    in
      div ([id featureId, class "ui-window"] ++ display) contents


renderRoadNode : Trigger -> Maybe Mode -> String -> RoadNode -> List Html
renderRoadNode trigger maybeMode titlePrefix roadNode =
    let
      title =
        [renderWindowTitle (titlePrefix ++ " Road Node")]
      description =
        case roadNode.address of
          Nothing ->
            []
          Just address ->
            [div [] [text address]]
      buttons =
        case (roadNode.isDeleted, roadNode.isUndeletable) of
          (False, _) ->
            ( renderButtons trigger
                [ renderToggle2 "Get Route" (maybeMode == Just GetRoute)
                    (Send (SetMode (Just GetRoute)))
                    (Send (SetMode Nothing))
                , renderAction "Delete" (Send DeleteSelectedFeature)
                ] ++
              renderButtons trigger
                [ renderToggle2 "Get Route from Google" (maybeMode == Just GetRouteFromGoogle)
                    (Send (SetMode (Just GetRouteFromGoogle)))
                    (Send (SetMode Nothing))
                ]
            )
          (True, True) ->
            renderButtons trigger
              [ renderAction "Undelete" (Send UndeleteSelectedFeature)
              ]
          _ ->
            []
      location =
        case roadNode.point of
          (x, y) ->
            renderLabeled "Location" [div [] [text (toString (round x) ++ " " ++ toString (round y))]]
      toid =
        renderLabeled "TOID" [renderTOID trigger roadNode.toid]
      roadLinks =
        renderLabeledList "Road Links" (renderTOIDItem trigger) roadNode.roadLinkTOIDs
    in
      title ++ description ++ buttons ++ location ++ toid ++ roadLinks


renderRoadLink : Trigger -> String -> RoadLink -> List Html
renderRoadLink trigger titlePrefix roadLink =
    let
      title =
        [renderWindowTitle (titlePrefix ++ " Road Link")]
      description =
        [div [] [renderRoadLinkDescription roadLink]]
      buttons =
        case (roadLink.isDeleted, roadLink.isUndeletable) of
          (False, _) ->
            renderButtons trigger
              [ renderAction "Delete" (Send DeleteSelectedFeature)
              ]
          (True, True) ->
            renderButtons trigger
              [ renderAction "Undelete" (Send UndeleteSelectedFeature)
              ]
          _ ->
            []
      cost =
        renderLabeled "Cost" [div [] [text (toString (round roadLink.length) ++ " × " ++ toString roadLink.penalty)]]
      toid =
        renderLabeled "TOID" [renderTOID trigger roadLink.toid]
      roadNodes =
        case (roadLink.negativeNodeTOID, roadLink.positiveNodeTOID) of
          (Nothing, Nothing) ->
            []
          (Just negativeNodeTOID, Nothing) ->
            renderLabeled "Road Nodes"
              [ div [] [text "− ", renderTOID trigger negativeNodeTOID]
              ]
          (Nothing, Just positiveNodeTOID) ->
            renderLabeled "Road Nodes"
              [ div [] [text "+ ", renderTOID trigger positiveNodeTOID]
              ]
          (Just negativeNodeTOID, Just positiveNodeTOID) ->
            renderLabeled "Road Nodes"
              [ div [] [text "− ", renderTOID trigger negativeNodeTOID]
              , div [] [text "+ ", renderTOID trigger positiveNodeTOID]
              ]
      roads =
        renderLabeledList "Roads" (renderRoadItem trigger) roadLink.roads
    in
      title ++ description ++ buttons ++ cost ++ toid ++ roadNodes ++ roads


renderRoadLinkDescription : RoadLink -> Html
renderRoadLinkDescription roadLink =
    text (roadLink.term ++ ", " ++ roadLink.nature)


renderRoadItem : Trigger -> Road -> Html
renderRoadItem trigger road =
    let
      toid =
        [renderTOIDItem trigger road.toid]
      description =
        [div [] [renderRoadDescription road]]
    in
      div [] (toid ++ description)


renderRoad : Trigger -> String -> Road -> List Html
renderRoad trigger titlePrefix road =
    let
      title =
        [renderWindowTitle (titlePrefix ++ " Road")]
      description =
        [div [] [renderRoadDescription road]]
      buttons =
        case road.isDeleted of
          False ->
            renderButtons trigger
              [ renderAction "Delete" (Send DeleteSelectedFeature)
              ]
          True ->
            renderButtons trigger
              [ renderAction "Undelete" (Send UndeleteSelectedFeature)
              ]
      toid =
        renderLabeled "TOID" [renderTOID trigger road.toid]
      roadLinks =
        renderLabeledList "Road Links" (renderTOIDItem trigger) road.roadLinkTOIDs
    in
      title ++ description ++ buttons ++ toid ++ roadLinks


renderRoute : Trigger -> String -> Route -> List Html
renderRoute trigger titlePrefix route =
    let
      title =
        [renderWindowTitle (titlePrefix ++ " Route")]
      buttons =
        renderButtons trigger
          [ renderAction "Delete" (Send DeleteSelectedFeature)
          ]
      toid =
        renderLabeled "TOID" [renderTOID trigger route.toid]
      roadNodes =
        renderLabeled "Road Nodes"
          [ div [] [text "< ", renderTOID trigger route.startNodeTOID]
          , div [] [text "> ", renderTOID trigger route.endNodeTOID]
          ]
      roadLinks =
        renderLabeledList "Road Links" (renderTOIDItem trigger) route.roadLinkTOIDs
    in
      title ++ buttons ++ toid ++ roadNodes ++ roadLinks


renderRoadDescription : Road -> Html
renderRoadDescription road =
    case road.term of
      Nothing ->
        text (road.name ++ ", " ++ road.group)
      Just term ->
        text (road.name ++ ", " ++ road.group ++ ", " ++ term)


renderViewsWindow : Trigger -> List ViewGroup -> List View -> Bool -> Html
renderViewsWindow trigger viewGroups activeViews viewInfoVisible =
    let
      allViews = List.concatMap .views viewGroups
      findActiveIndex = List.findIndex (\view -> List.member view activeViews)
      maybeStart = findActiveIndex allViews
      maybeEnd = findActiveIndex (List.reverse allViews)
      extendChoice index view =
          case (maybeStart, maybeEnd) of
            (Just start, Just end) ->
              let
                targetStart = min index start
                reverseEnd = List.length allViews - end - 1
                targetEnd = max index reverseEnd
                targetCount = targetEnd - targetStart + 1
              in
                List.map .name (List.take targetCount (List.drop targetStart allViews))
            _ ->
              [view.name]
      renderViewGroupItem groupIndex index view trigger =
          let
            isActive = List.member view activeViews
            choose names = Send (ChooseViews names)
            alone = choose [view.name]
            extended = choose (extendChoice (groupIndex + index) view)
            toggled =
              if isActive
                then choose (List.filter ((/=) view.name) (List.map .name activeViews))
                else choose (view.name :: (List.map .name activeViews))
            handler = onClickWithModifiers trigger alone extended toggled alone toggled
            active =
              if isActive
                then [class "ui-active"]
                else []
          in
            a ([handler] ++ active) [text view.name]
      renderViewGroup viewGroup =
          case viewGroup.views of
            (view0 :: _) ->
              case List.findIndex ((==) view0) allViews of
                Just groupIndex ->
                  renderLabeledChoices trigger viewGroup.name
                    (List.indexedMap (renderViewGroupItem groupIndex) viewGroup.views)
                _ ->
                  []
            _ ->
              []
      contents =
        [renderWindowTitle "Views"] ++
        renderButtons trigger
          [ renderToggle "Show Info" viewInfoVisible ToggleViewInfo
          ] ++
        (List.concatMap renderViewGroup viewGroups)
    in
      div [class "ui-window"] contents


renderModelsWindow : Trigger -> List ModelGroup -> Maybe Model -> Bool -> Html
renderModelsWindow trigger modelGroups activeModel modelInfoVisible =
    let
      renderModelGroupItem model trigger =
          let
            isActive = activeModel == Just model
            active =
              if isActive
                then [class "ui-active"]
                else []
          in
            a ([] ++ active) [text model.name]
      renderModelGroup modelGroup =
          renderLabeledChoices trigger modelGroup.name
            (List.map renderModelGroupItem modelGroup.models)
      contents =
        [renderWindowTitle "Models"] ++
        renderButtons trigger
          [ renderToggle "Show Info" modelInfoVisible ToggleModelInfo
          ] ++
        (List.concatMap renderModelGroup modelGroups)
    in
      div [class "ui-window"] contents


renderDefinition : String -> List Html
renderDefinition lambda =
    renderLabeled "Definition"
      [pre [] [code [] [text lambda]]]


renderViewInfoWindow : Trigger -> List View -> Bool -> Html
renderViewInfoWindow trigger activeViews visible =
    let
      renderViewInfo view =
        [div [] [text view.name]] ++
        renderDefinition view.lambda
      display =
        if activeViews == [] || not visible
          then [style [("display", "none")]]
          else []
      contents =
        [renderWindowTitle "View Info"] ++
        (List.concat (List.intersperse [hr [] []] (List.map renderViewInfo activeViews)))
    in
      div ([class "ui-window wide"] ++ display) contents


renderModelInfoWindow : Trigger -> Maybe Model -> Bool -> Html
renderModelInfoWindow trigger activeModel visible =
    let
      renderModelInfo =
        case activeModel of
          Just model ->
            [div [] [text model.name]] ++
            renderDefinition model.lambda
          _ ->
            []
      display =
        if activeModel == Nothing || not visible
          then [style [("display", "none")]]
          else []
      contents =
        [renderWindowTitle "Model Info"] ++
        renderModelInfo
    in
      div ([class "ui-window wide"] ++ display) contents


renderRoutesWindow : Trigger -> List Route -> Html
renderRoutesWindow trigger routes =
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
                    renderRoutes trigger "Valid" validList
              invalidRoutes =
                case List.filter (\route -> route.roadLinkTOIDs == []) routes of
                  [] ->
                    []
                  invalidList ->
                    renderRoutes trigger "Invalid" invalidList
            in
              [renderWindowTitle "Routes"] ++
              renderButtons trigger
                [ renderAction "Clear" (Send ClearRoutes)
                , renderAction "Save as JSON" (SendSpecial SaveRoutesAsJSON)
                ] ++
              validRoutes ++
              invalidRoutes
    in
      div ([class "ui-window"] ++ display) contents


renderRoutes : Trigger -> String -> List Route -> List Html
renderRoutes trigger label routes =
    renderLabeledList label (renderTOIDItem trigger) (List.map .toid routes)


renderAdjustmentWindow : Trigger -> Maybe Adjustment -> Html
renderAdjustmentWindow trigger maybeAdjustment =
    let
      isEmpty =
        case maybeAdjustment of
          Nothing ->
            True
          Just adjustment ->
            if adjustment.itemCount == 0
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
            [renderWindowTitle "Adjustment"] ++
            renderButtons trigger
              [ renderAction "Clear" (Send ClearAdjustment)
              , renderAction "Save as JSON" (SendSpecial SaveAdjustmentAsJSON)
              ] ++
            [ div []
                ( renderLabeledList "Deleted Nodes" (renderTOIDItem trigger) adjustment.deletedFeatures.roadNodeTOIDs ++
                  renderLabeledList "Deleted Links" (renderTOIDItem trigger) adjustment.deletedFeatures.roadLinkTOIDs ++
                  renderLabeledList "Deleted Roads" (renderTOIDItem trigger) adjustment.deletedFeatures.roadTOIDs
                )
            ]
    in
      div ([class "ui-window"] ++ display) contents


renderWindowTitle : String -> Html
renderWindowTitle title =
    div [class "ui-window-title"] [text title]


renderTOIDItem : Trigger -> String -> Html
renderTOIDItem trigger toid =
    div [] [renderTOID trigger toid]


renderTOID : Trigger -> String -> Html
renderTOID trigger toid =
    a
      [ onClick trigger (Send (SelectFeatureByTOID (Just toid)))
      , onMouseEnter trigger (Send (HighlightFeatureByTOID (Just toid)))
      , onMouseLeave trigger (Send (HighlightFeatureByTOID Nothing))
      ]
      [text toid]


renderLabeledList : String -> (a -> Html) -> List a -> List Html
renderLabeledList label render items =
    let
      itemCount = List.length items
      fullLabel =
        if itemCount > 2
          then label ++ " (" ++ toString (itemCount) ++ ")"
          else label
    in
      case items of
        [] ->
          []
        _ ->
          renderLabeled fullLabel [div [] (List.map render items)]


renderLabeled : String -> List Html -> List Html
renderLabeled label contents =
    [renderLabel label] ++ contents


renderLabel : String -> Html
renderLabel label =
    div [class "ui-label"] [text label]


renderLabeledChoices : Trigger -> String -> List (Trigger -> Html) -> List Html
renderLabeledChoices trigger label actions =
    case actions of
      [] ->
        []
      _ ->
        renderLabeled label (renderChoices trigger actions)


renderChoices : Trigger -> List (Trigger -> Html) -> List Html
renderChoices trigger actions =
    [div [class "ui-choices"] (List.map (\action -> action trigger) actions)]


renderButtons : Trigger -> List (Trigger -> Html) -> List Html
renderButtons trigger actions =
    [div [class "ui-buttons"] (List.map (\action -> action trigger) actions)]


renderAction : String -> Action -> Trigger -> Html
renderAction label action trigger =
    a [onClick trigger action] [text label]


renderToggle : String -> Bool -> Action -> Trigger -> Html
renderToggle label isActive action trigger =
    let
      attrs =
        if isActive
          then [onClick trigger action, class "ui-active"]
          else [onClick trigger action]
    in
      a attrs [text label]


renderToggle2 : String -> Bool -> Action -> Action -> Trigger -> Html
renderToggle2 label isActive action activeAction trigger =
    let
      attrs =
        if isActive
          then [onClick trigger activeAction, class "ui-active"]
          else [onClick trigger action]
    in
      a attrs [text label]
