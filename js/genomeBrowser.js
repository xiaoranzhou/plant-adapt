
      const { React, createRoot, createViewState, JBrowseApp } =
        window.JBrowseReactApp
      const dataServer = 'https://localhost:8080/public/genomeBrowser/'
      const viewState = createViewState({
        config: {
          assemblies: [
            {
              name: 'Camelina Sativa (Cs)',
              aliases: ['Cs'],
              sequence: {
                type: 'ReferenceSequenceTrack',
                trackId: 'Camelina_Sativa_(Cs)-ReferenceSequenceTrack',
                adapter: {
                  type: 'BgzipFastaAdapter',
                  fastaLocation: {
                    uri: dataServer +'Cs.fa.gz',
                    locationType: 'UriLocation'
                  },
                  faiLocation: {
                    uri: dataServer +'Cs.fa.gz.fai',
                    locationType: 'UriLocation'
                  },
                  gziLocation: {
                    uri: dataServer +'Cs.fa.gz.gzi',
                    locationType: 'UriLocation'
                  }
                }
              }
            }
          ],
          tracks: [
            {
              type: 'FeatureTrack',
              trackId: 'Camelina_Sativa_(Cs)_GFF',
              name: 'Structural Annotations',
              assemblyNames: ['Camelina Sativa (Cs)'],
              category: ['Annotation'],
              adapter: {
                type: 'Gff3TabixAdapter',
                gffGzLocation: {
                  uri: dataServer +'Cs.gff3.gz',
                  locationType: 'UriLocation'
                },
                index: {
                  location: {
                    uri: dataServer +'Cs.gff3.gz.tbi',
                    locationType: 'UriLocation'
                  },
                  indexType: 'TBI'
                }
              }
            },
            {
              type: 'VariantTrack',
              trackId: 'untwist_VCF',
              name: 'Untwist Variant',
              assemblyNames: ['Camelina Sativa (Cs)'],
              category: ['Variation data'],
              adapter: {
                type: 'VcfTabixAdapter',
                vcfGzLocation: {
                  locationType: 'UriLocation',
                  uri: dataServer +'UNT54.lifted.sorted.vcf.bgzip'
                },
                index: {
                  location: {
                    locationType: 'UriLocation',
                    uri: dataServer +'UNT54.lifted.sorted.vcf.bgzip.tbi'
                  },
                  indexType: 'TBI'
                }
              }
            },
            {
              type: 'QuantitativeTrack',
              trackId: 'DH55_root_salt_CPM',
              name: 'DH55_root_salt_CPM',
              category: ['Expression Counts Under Stress Conditions'],
              assemblyNames: ['Camelina Sativa (Cs)'],
              adapter: {
                type: 'BigWigAdapter',
                bigWigLocation: {
                  uri: dataServer +'DH55_root_salt_CPM.bw',
                  locationType: 'UriLocation'
                }
              }
            },
            {
              type: 'QuantitativeTrack',
              trackId: 'DH55_root_control_CPM',
              name: 'DH55_root_control_CPM',
              category: ['Expression Counts Under Stress Conditions'],
              assemblyNames: ['Camelina Sativa (Cs)'],
              adapter: {
                type: 'BigWigAdapter',
                bigWigLocation: {
                  uri: dataServer +'DH55_root_control_CPM.bw',
                  locationType: 'UriLocation'
                }
              }
            },
            {
              type: 'QuantitativeTrack',
              trackId: 'DH55_shoot_control_CPM',
              name: 'DH55_shoot_control_CPM',
              category: ['Expression Counts Under Stress Conditions'],
              assemblyNames: ['Camelina Sativa (Cs)'],
              adapter: {
                type: 'BigWigAdapter',
                bigWigLocation: {
                  uri: dataServer +'DH55_shoot_control_CPM.bw',
                  locationType: 'UriLocation'
                }
              }
            },
            {
              type: 'QuantitativeTrack',
              trackId: 'DH55_shoot_salt_CPM',
              name: 'DH55_shoot_salt_CPM',
              category: ['Expression Counts Under Stress Conditions'],
              assemblyNames: ['Camelina Sativa (Cs)'],
              adapter: {
                type: 'BigWigAdapter',
                bigWigLocation: {
                  uri: dataServer +'DH55_shoot_salt_CPM.bw',
                  locationType: 'UriLocation'
                }
              }
            },
            {
              type: 'QuantitativeTrack',
              trackId: 'SRR1171928_Root_DH55_TPM',
              name: 'SRR1171928_Root_DH55_TPM',
              assemblyNames: ['Camelina Sativa (Cs)'],
              category: ['Tissu Specific Expression Counts'],
              adapter: {
                type: 'BigWigAdapter',
                bigWigLocation: {
                  uri: dataServer +'SRR1171928_Root_DH55_TPM.bw',
                  locationType: 'UriLocation'
                }
              }
            },
            {
              type: 'QuantitativeTrack',
              trackId: 'SRR1171929_Root_DH55_TPM',
              name: 'SRR1171929_Root_DH55_TPM',
              assemblyNames: ['Camelina Sativa (Cs)'],
              category: ['Tissu Specific Expression Counts'],
              adapter: {
                type: 'BigWigAdapter',
                bigWigLocation: {
                  uri: dataServer +'SRR1171929_Root_DH55_TPM.bw',
                  locationType: 'UriLocation'
                }
              }
            },
            {
              type: 'QuantitativeTrack',
              trackId: 'SRR1171931_Root_DH55_TPM',
              name: 'SRR1171931_Root_DH55_TPM',
              assemblyNames: ['Camelina Sativa (Cs)'],
              category: ['Tissu Specific Expression Counts'],
              adapter: {
                type: 'BigWigAdapter',
                bigWigLocation: {
                  uri: dataServer +'SRR1171931_Root_DH55_TPM.bw',
                  locationType: 'UriLocation'
                }
              }
            },
            {
              type: 'QuantitativeTrack',
              trackId: 'SRR1171881_Plant_DH55_TPM',
              name: 'SRR1171881_Plant_DH55_TPM',
              assemblyNames: ['Camelina Sativa (Cs)'],
              category: ['Tissu Specific Expression Counts'],
              adapter: {
                type: 'BigWigAdapter',
                bigWigLocation: {
                  uri: dataServer +'SRR1171881_Plant_DH55_TPM.bw',
                  locationType: 'UriLocation'
                }
              }
            },
            {
              type: 'QuantitativeTrack',
              trackId: 'SRR1171882_Plant_DH55_TPM',
              name: 'SRR1171882_Plant_DH55_TPM',
              assemblyNames: ['Camelina Sativa (Cs)'],
              category: ['Tissu Specific Expression Counts'],
              adapter: {
                type: 'BigWigAdapter',
                bigWigLocation: {
                  uri: dataServer +'SRR1171882_Plant_DH55_TPM.bw',
                  locationType: 'UriLocation'
                }
              }
            },
            {
              type: 'QuantitativeTrack',
              trackId: 'SRR1171883_Plant_DH55_TPM',
              name: 'SRR1171883_Plant_DH55_TPM',
              assemblyNames: ['Camelina Sativa (Cs)'],
              category: ['Tissu Specific Expression Counts'],
              adapter: {
                type: 'BigWigAdapter',
                bigWigLocation: {
                  uri: dataServer +'SRR1171883_Plant_DH55_TPM.bw',
                  locationType: 'UriLocation'
                }
              }
            },
            {
              type: 'QuantitativeTrack',
              trackId: 'SRR1171949_Flower_DH55_TPM',
              name: 'SRR1171949_Flower_DH55_TPM',
              assemblyNames: ['Camelina Sativa (Cs)'],
              category: ['Tissu Specific Expression Counts'],
              adapter: {
                type: 'BigWigAdapter',
                bigWigLocation: {
                  uri: dataServer +'SRR1171949_Flower_DH55_TPM.bw',
                  locationType: 'UriLocation'
                }
              }
            },
            {
              type: 'QuantitativeTrack',
              trackId: 'SRR1171950_Flower_DH55_TPM',
              name: 'SRR1171950_Flower_DH55_TPM',
              assemblyNames: ['Camelina Sativa (Cs)'],
              category: ['Tissu Specific Expression Counts'],
              adapter: {
                type: 'BigWigAdapter',
                bigWigLocation: {
                  uri: dataServer +'SRR1171950_Flower_DH55_TPM.bw',
                  locationType: 'UriLocation'
                }
              }
            },
            {
              type: 'QuantitativeTrack',
              trackId: 'SRR1171951_Flower_DH55_TPM',
              name: 'SRR1171951_Flower_DH55_TPM',
              assemblyNames: ['Camelina Sativa (Cs)'],
              category: ['Tissu Specific Expression Counts'],
              adapter: {
                type: 'BigWigAdapter',
                bigWigLocation: {
                  uri: dataServer +'SRR1171951_Flower_DH55_TPM.bw',
                  locationType: 'UriLocation'
                }
              }
            },
            {
              type: 'QuantitativeTrack',
              trackId: 'SRR1171888_Seed_DH55_TPM',
              name: 'SRR1171888_Seed_DH55_TPM',
              assemblyNames: ['Camelina Sativa (Cs)'],
              category: ['Tissu Specific Expression Counts'],
              adapter: {
                type: 'BigWigAdapter',
                bigWigLocation: {
                  uri: dataServer +'SRR1171888_Seed_DH55_TPM.bw',
                  locationType: 'UriLocation'
                }
              }
            },
            {
              type: 'QuantitativeTrack',
              trackId: 'SRR1171890_Seed_DH55_TPM',
              name: 'SRR1171890_Seed_DH55_TPM',
              assemblyNames: ['Camelina Sativa (Cs)'],
              category: ['Tissu Specific Expression Counts'],
              adapter: {
                type: 'BigWigAdapter',
                bigWigLocation: {
                  uri: dataServer +'SRR1171890_Seed_DH55_TPM.bw',
                  locationType: 'UriLocation'
                }
              }
            },
            {
              type: 'QuantitativeTrack',
              trackId: 'SRR1171891_Seed_DH55_TPM',
              name: 'SRR1171891_Seed_DH55_TPM',
              assemblyNames: ['Camelina Sativa (Cs)'],
              category: ['Tissu Specific Expression Counts'],
              adapter: {
                type: 'BigWigAdapter',
                bigWigLocation: {
                  uri: dataServer +'SRR1171891_Seed_DH55_TPM.bw',
                  locationType: 'UriLocation'
                }
              }
            },
            {
              type: 'QuantitativeTrack',
              trackId: 'SRR1171954_Seed_DH55_TPM',
              name: 'SRR1171954_Seed_DH55_TPM',
              assemblyNames: ['Camelina Sativa (Cs)'],
              category: ['Tissu Specific Expression Counts'],
              adapter: {
                type: 'BigWigAdapter',
                bigWigLocation: {
                  uri: dataServer +'SRR1171954_Seed_DH55_TPM.bw',
                  locationType: 'UriLocation'
                }
              }
            },
            {
              type: 'QuantitativeTrack',
              trackId: 'SRR1171955_Seed_DH55_TPM',
              name: 'SRR1171955_Seed_DH55_TPM',
              assemblyNames: ['Camelina Sativa (Cs)'],
              category: ['Tissu Specific Expression Counts'],
              adapter: {
                type: 'BigWigAdapter',
                bigWigLocation: {
                  uri: dataServer +'SRR1171955_Seed_DH55_TPM.bw',
                  locationType: 'UriLocation'
                }
              }
            },
            {
              type: 'QuantitativeTrack',
              trackId: 'SRR6026670_Root_DH55_TPM',
              name: 'SRR6026670_Root_DH55_TPM',
              assemblyNames: ['Camelina Sativa (Cs)'],
              category: ['Tissu Specific Expression Counts'],
              adapter: {
                type: 'BigWigAdapter',
                bigWigLocation: {
                  uri: dataServer +'SRR6026670_Root_DH55_TPM.bw',
                  locationType: 'UriLocation'
                }
              }
            },
            {
              type: 'QuantitativeTrack',
              trackId: 'SRR6026671_Root_DH55_TPM',
              name: 'SRR6026671_Root_DH55_TPM',
              assemblyNames: ['Camelina Sativa (Cs)'],
              category: ['Tissu Specific Expression Counts'],
              adapter: {
                type: 'BigWigAdapter',
                bigWigLocation: {
                  uri: dataServer +'SRR6026671_Root_DH55_TPM.bw',
                  locationType: 'UriLocation'
                }
              }
            },
            {
              type: 'QuantitativeTrack',
              trackId: 'SRR6026672_Root_DH55_TPM',
              name: 'SRR6026672_Root_DH55_TPM',
              assemblyNames: ['Camelina Sativa (Cs)'],
              category: ['Tissu Specific Expression Counts'],
              adapter: {
                type: 'BigWigAdapter',
                bigWigLocation: {
                  uri: dataServer +'SRR6026672_Root_DH55_TPM.bw',
                  locationType: 'UriLocation'
                }
              }
            },
            {
              type: 'QuantitativeTrack',
              trackId: 'SRR935333_Seed_NA_TPM',
              name: 'SRR935333_Seed_NA_TPM',
              assemblyNames: ['Camelina Sativa (Cs)'],
              category: ['Tissu Specific Expression Counts'],
              adapter: {
                type: 'BigWigAdapter',
                bigWigLocation: {
                  uri: dataServer +'SRR935333_Seed_NA_TPM.bw',
                  locationType: 'UriLocation'
                }
              }
            },
            {
              type: 'QuantitativeTrack',
              trackId: 'SRR935362_Leaf_NA_TPM',
              name: 'SRR935362_Leaf_NA_TPM',
              assemblyNames: ['Camelina Sativa (Cs)'],
              category: ['Tissu Specific Expression Counts'],
              adapter: {
                type: 'BigWigAdapter',
                bigWigLocation: {
                  uri: dataServer +'SRR935362_Leaf_NA_TPM.bw',
                  locationType: 'UriLocation'
                }
              }
            },
            {
              type: 'QuantitativeTrack',
              trackId: 'SRR935365_Stem_NA_TPM',
              name: 'SRR935365_Stem_NA_TPM',
              assemblyNames: ['Camelina Sativa (Cs)'],
              category: ['Tissu Specific Expression Counts'],
              adapter: {
                type: 'BigWigAdapter',
                bigWigLocation: {
                  uri: dataServer +'SRR935365_Stem_NA_TPM.bw',
                  locationType: 'UriLocation'
                }
              }
            },
            {
              type: 'QuantitativeTrack',
              trackId: 'SRR935368_Root_NA_TPM',
              name: 'SRR935368_Root_NA_TPM',
              assemblyNames: ['Camelina Sativa (Cs)'],
              category: ['Tissu Specific Expression Counts'],
              adapter: {
                type: 'BigWigAdapter',
                bigWigLocation: {
                  uri: dataServer +'SRR935368_Root_NA_TPM.bw',
                  locationType: 'UriLocation'
                }
              }
            },
            {
              type: 'QuantitativeTrack',
              trackId: 'SRR935369_Flower_NA_TPM',
              name: 'SRR935369_Flower_NA_TPM',
              assemblyNames: ['Camelina Sativa (Cs)'],
              category: ['Tissu Specific Expression Counts'],
              adapter: {
                type: 'BigWigAdapter',
                bigWigLocation: {
                  uri: dataServer +'SRR935369_Flower_NA_TPM.bw',
                  locationType: 'UriLocation'
                }
              }
            }
          ],
          defaultSession: {
            name: 'Camelina Sativa Browser Session',
            views: [
              {
                id: 'linearGenomeView',
                type: 'LinearGenomeView',
                displayedRegions: [
                  {
                    refName: '1',
                    start: 1,
                    end: 10000000,
                    reversed: false,
                    assemblyName: 'Camelina Sativa (Cs)'
                  }
                ],
                tracks: [],
                hideHeader: false,
                hideHeaderOverview: false,
                hideNoTracksActive: false,
                trackSelectorType: 'hierarchical',
                showTrackSelector: true,
                trackLabels: 'overlapping'
              }
            ]
          }
        }
      })

      const root = createRoot(document.getElementById('jbrowse_app'))
      root.render(
        React.createElement(JBrowseApp, {
          viewState,
        }),
      )


      const showGenomeBrowser = async function (point ) {
        const start = point - 1000;
        const end = point + 1000;
        setTimeout(async () => {
        try {
          const session = viewState.session
          const view = session.views[0] // Get the linear genome view

          if (view && view.type === 'LinearGenomeView') {
            // Get assembly information to determine chromosome length
            const assemblyManager = session.assemblies[0]

            if (assemblyManager) {
              try {
                // Get regions from the assembly to find chromosome 1 length
                const regions = await assemblyManager.regions
                const chr1 = regions.find(region => region.refName === '1')

                if (chr1) {
                  // Set the displayed region to show the full chromosome 1
                  view.navToLocString(`1:1-${chr1.end}`)
                  console.log(`Set view to full chromosome 1: 1-${chr1.end}`)
                } else {
                  // Fallback to a reasonable default
                  await session.assemblies[0]
                  await viewState.session.views[0].navToLocString(point);
                }
              } catch (regionError) {
                console.log('Could not get assembly regions, using default')
                view.navToLocString('1:1-20000000')
              }
            }

            // Add reference sequence track first
            view.showTrack('Camelina_Sativa_(Cs)-ReferenceSequenceTrack')

            // Wait a bit more and add other tracks
            setTimeout(() => {
              view.showTrack('Camelina_Sativa_(Cs)_GFF')
              view.showTrack('untwist_VCF')
              // Add all DH55 stress condition tracks
              view.showTrack('DH55_root_salt_CPM')
              view.showTrack('DH55_root_control_CPM')
              view.showTrack('DH55_shoot_control_CPM')
              view.showTrack('DH55_shoot_salt_CPM')
            }, 2000)
          }
        } catch (error) {
          console.log('Track loading delayed, files may not be ready yet:', error)
        }
      }, 3000)
   
      
      
      }
      // Wait for files to be ready and then automatically set region and load tracks
   showGenomeBrowser("1:10-2");
   function jbNav(location){
    window.location.hash = '#browse'; 
    viewState.session.views[0].navToLocString(location)
  }